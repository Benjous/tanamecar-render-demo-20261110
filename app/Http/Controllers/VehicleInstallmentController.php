<?php

namespace App\Http\Controllers;

use App\Models\AutolocTraiteSummary;
use App\Models\Vehicle;
use App\Models\VehicleInstallment;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VehicleInstallmentController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->filteredQuery($request);
        $rows = (clone $query)
            ->with(['vehicle:id,display_name,plate_number', 'modifiedBy:id,name'])
            ->orderByRaw("CASE WHEN status = 'unpaid' THEN 0 ELSE 1 END")
            ->orderBy('due_date')
            ->get();

        return Inertia::render('VehicleInstallments/Index', [
            'installments' => $rows,
            'summaries' => AutolocTraiteSummary::query()
                ->with('vehicle:id,display_name,plate_number')
                ->orderBy('source_vehicle_name')
                ->get(),
            'filters' => $request->only(['q', 'status', 'vehicle_id', 'from', 'to', 'due']),
            'stats' => [
                'count' => $rows->count(),
                'recorded_sum' => $rows->where('origin', 'autoloc')->sum('amount_recorded'),
                'paid_count' => $rows->where('status', 'paid')->count(),
                'unpaid_count' => $rows->where('status', 'unpaid')->count(),
                'summary_count' => AutolocTraiteSummary::query()->count(),
                'unmatched_summary_count' => AutolocTraiteSummary::query()->whereNull('vehicle_id')->count(),
            ],
            'dueSoonDays' => (int) config('autoloc_traite.due_soon_days', 30),
            'today' => now('Africa/Casablanca')->toDateString(),
            'canCreate' => $request->user()->canDo('vehicle_installments', 'create'),
        ]);
    }

    public function show(VehicleInstallment $installment)
    {
        $installment->load(['vehicle:id,display_name,plate_number', 'summary', 'createdBy:id,name', 'modifiedBy:id,name']);

        return Inertia::render('VehicleInstallments/Show', [
            'installment' => $installment,
            'canUpdate' => request()->user()->canAccessRecord('vehicle_installments', 'update', $installment),
            'dueSoonDays' => (int) config('autoloc_traite.due_soon_days', 30),
            'today' => now('Africa/Casablanca')->toDateString(),
        ]);
    }

    public function showSummary(AutolocTraiteSummary $summary)
    {
        $summary->load('vehicle:id,display_name,plate_number');
        $installments = VehicleInstallment::query()
            ->with('modifiedBy:id,name')
            ->where('summary_id', $summary->id)
            ->orderBy('due_date')
            ->get();
        $totalMonths = $summary->total_months_recorded === null ? null : (int) $summary->total_months_recorded;
        $paidMonths = $installments->where('status', 'paid')->count();
        $calculatedTotal = (float) ($summary->monthly_amount_recorded ?? 0) * (int) ($summary->total_months_recorded ?? 0);
        $calculatedPaidAmount = (float) $installments->where('status', 'paid')->sum('amount_current');

        return Inertia::render('VehicleInstallments/Summary', [
            'summary' => $summary,
            'installments' => $installments,
            'calculated' => [
                'total_amount' => round($calculatedTotal, 6),
                'paid_months' => $paidMonths,
                'remaining_months' => $totalMonths === null ? null : $totalMonths - $paidMonths,
                'paid_amount' => round($calculatedPaidAmount, 6),
            ],
            'differences' => [
                'total_amount' => $summary->total_amount_recorded === null ? null : round($calculatedTotal - (float) $summary->total_amount_recorded, 6),
                'paid_months' => $summary->paid_months_recorded === null ? null : $paidMonths - (int) $summary->paid_months_recorded,
                'remaining_months' => $summary->remaining_months_recorded === null || $totalMonths === null ? null : ($totalMonths - $paidMonths) - (int) $summary->remaining_months_recorded,
                'paid_amount' => $summary->paid_amount_recorded === null ? null : round($calculatedPaidAmount - (float) $summary->paid_amount_recorded, 6),
            ],
            'canCreate' => request()->user()->canDo('vehicle_installments', 'create'),
            'canUpdate' => request()->user()->canDo('vehicle_installments', 'update'),
            'dueSoonDays' => (int) config('autoloc_traite.due_soon_days', 30),
            'today' => now('Africa/Casablanca')->toDateString(),
        ]);
    }

    public function create()
    {
        return Inertia::render('VehicleInstallments/Form', $this->formProps(null));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $summary = AutolocTraiteSummary::query()->where('vehicle_id', $data['vehicle_id'])->first();
        $installment = VehicleInstallment::create([
            ...$data,
            'summary_id' => $summary?->id,
            'origin' => 'manual',
            'amount_recorded' => null,
            'amount_text' => null,
            'date_recorded' => null,
            'description_recorded' => null,
            'status_recorded' => null,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('vehicle-installments.show', $installment)->with('success', 'Traite créée.');
    }

    public function edit(VehicleInstallment $installment)
    {
        abort_unless(request()->user()->canAccessRecord('vehicle_installments', 'update', $installment), 403);

        return Inertia::render('VehicleInstallments/Form', $this->formProps($installment));
    }

    public function update(Request $request, VehicleInstallment $installment)
    {
        abort_unless($request->user()->canAccessRecord('vehicle_installments', 'update', $installment), 403);
        $data = $this->validated($request);
        $installment->update([
            ...$data,
            'modified_by' => $request->user()->id,
            'modified_at' => now(),
        ]);

        return redirect()->route('vehicle-installments.show', $installment)->with('success', 'Traite mise à jour.');
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $rows = $this->filteredQuery($request)->with('vehicle:id,display_name,plate_number')->orderBy('due_date')->get();

        return response()->streamDownload(function () use ($rows): void {
            $stream = fopen('php://output', 'w');
            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, ['Voiture', 'Matricule', 'Montant enregistré', 'Montant actuel', 'Date enregistrée', 'Date actuelle', 'Description enregistrée', 'Description actuelle', 'Statut enregistré', 'Statut actuel', 'Origine', 'Identifiant historique']);
            foreach ($rows as $row) {
                fputcsv($stream, [
                    $row->vehicle?->display_name ?? $row->summary?->source_vehicle_name ?? '',
                    $row->vehicle?->plate_number ?? $row->summary?->source_plate ?? '',
                    $row->amount_recorded,
                    $row->amount_current,
                    $row->date_recorded?->toDateString(),
                    $row->due_date?->toDateString(),
                    $row->description_recorded,
                    $row->description,
                    $row->status_recorded,
                    $row->status,
                    $row->origin,
                    $row->source_key,
                ]);
            }
            fclose($stream);
        }, 'traites.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filteredQuery(Request $request)
    {
        $search = app(SearchService::class);
        $query = VehicleInstallment::query()->with('summary:id,source_vehicle_name,source_plate');
        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($builder) use ($q, $search) {
                $search->apply($builder, [
                    'vehicle_installments.description',
                    'vehicle_installments.description_recorded',
                    'vehicle_installments.source_key',
                    'vehicle_installments.amount_current',
                    'vehicle_installments.amount_recorded',
                    'vehicle_installments.due_date',
                ], $q);
                $builder->orWhereHas('vehicle', fn ($vehicle) => $search->apply($vehicle, ['display_name', 'plate_number'], $q))
                    ->orWhereHas('summary', fn ($summary) => $search->apply($summary, ['source_vehicle_name', 'source_plate'], $q));
            });
        }
        if ($request->filled('status') && in_array($request->string('status')->toString(), ['paid', 'unpaid'], true)) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('vehicle_id') && is_numeric($request->input('vehicle_id'))) {
            $query->where('vehicle_id', (int) $request->input('vehicle_id'));
        }
        if ($request->filled('summary_id') && is_numeric($request->input('summary_id'))) {
            $query->where('summary_id', (int) $request->input('summary_id'));
        }
        if ($request->string('due')->toString() === 'overdue') {
            $query->where('status', 'unpaid')->whereDate('due_date', '<', now('Africa/Casablanca')->toDateString());
        } elseif ($request->string('due')->toString() === 'soon') {
            $query->where('status', 'unpaid')
                ->whereDate('due_date', '>=', now('Africa/Casablanca')->toDateString())
                ->whereDate('due_date', '<=', now('Africa/Casablanca')->addDays(30)->toDateString());
        }
        if ($request->filled('from')) {
            $query->whereDate('due_date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('due_date', '<=', $request->date('to'));
        }
        return $query;
    }

    private function formProps(?VehicleInstallment $installment): array
    {
        return [
            'installment' => $installment?->load('vehicle:id,display_name,plate_number'),
            'vehicles' => Vehicle::query()->orderBy('display_name')->get(['id', 'display_name', 'plate_number']),
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'amount_current' => ['required', 'numeric', 'min:0', 'max:999999999999.999999'],
            'due_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'in:paid,unpaid'],
        ]);
    }
}
