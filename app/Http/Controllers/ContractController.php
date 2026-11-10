<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Document;
use App\Models\Employee;
use App\Models\Payment;
use App\Models\Vehicle;
use App\Services\ArchiveService;
use App\Services\AuditService;
use App\Services\FileStoreService;
use App\Services\PdfService;
use App\Services\SearchService;
use App\Services\SequenceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ContractController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = ArchiveService::exclude(DB::table('contracts'), 'contracts', 'contracts.id')
            ->leftJoin('clients', 'clients.id', '=', 'contracts.client_id')
            ->leftJoin('vehicles', 'vehicles.id', '=', 'contracts.vehicle_id')
            ->leftJoin('v_contract_financials as f', 'f.id', '=', 'contracts.id')
            ->select(
                'contracts.id', 'contracts.reference', 'contracts.departure_at', 'contracts.return_at',
                'contracts.total_amount', 'contracts.returned', 'contracts.data_quality_status',
                'clients.display_name as client_display_name',
                'vehicles.display_name as vehicle_display_name', 'vehicles.plate_number as vehicle_plate_number',
                'f.paid_amount_calculated', 'f.remaining_calculated', 'f.has_mismatch',
            );

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $search->apply($query, [
                'contracts.reference',
                'contracts.id',
                'contracts.total_amount',
                'contracts.departure_at',
                'contracts.return_at',
                'contracts.note',
                'clients.display_name',
                'clients.phone',
                'clients.email',
                'vehicles.display_name',
                'vehicles.plate_number',
            ], $q);
        }

        match ($request->string('status')->toString()) {
            'open' => $query->where('contracts.returned', false),
            'returned' => $query->where('contracts.returned', true),
            'overdue' => $query->where('contracts.returned', false)->whereNotNull('contracts.return_at')->where('contracts.return_at', '<', CarbonImmutable::now(Contract::OPERATIONS_TIMEZONE)->startOfDay()->utc()),
            default => null,
        };

        $due = $request->string('due')->toString();
        if (in_array($due, ['today', 'tomorrow', 'after_tomorrow', 'month'], true)) {
            $today = CarbonImmutable::now(Contract::OPERATIONS_TIMEZONE)->startOfDay();
            $start = match ($due) {
                'today' => $today,
                'tomorrow' => $today->addDay(),
                'after_tomorrow' => $today->addDays(2),
                'month' => $today->startOfMonth(),
            };
            $end = $due === 'month' ? $start->addMonth() : $start->addDay();
            $query->where('contracts.returned', false)
                ->whereNotNull('contracts.return_at')
                ->where('contracts.return_at', '>=', $start->utc())
                ->where('contracts.return_at', '<', $end->utc());
        }

        if ($from = $request->date('date_from')) {
            $query->where('contracts.departure_at', '>=', $from->startOfDay());
        }
        if ($to = $request->date('date_to')) {
            $query->where('contracts.departure_at', '<=', $to->endOfDay());
        }

        $sort = in_array($request->string('sort')->toString(), ['reference', 'departure_at', 'return_at', 'total_amount', 'created_at'], true)
            ? $request->string('sort')->toString() : 'departure_at';
        $dir = $request->string('dir')->toString() === 'desc' ? 'desc' : 'asc';
        $query->orderBy("contracts.{$sort}", $dir);

        $contracts = $query->get()->map(fn ($row) => [
            'id' => $row->id,
            'reference' => $row->reference,
            'departure_at' => $row->departure_at,
            'return_at' => $row->return_at,
            'total_amount' => $row->total_amount,
            'returned' => (bool) $row->returned,
            'data_quality_status' => $row->data_quality_status,
            'paid_amount_calculated' => $row->paid_amount_calculated,
            'remaining_calculated' => $row->remaining_calculated,
            'has_mismatch' => (bool) $row->has_mismatch,
            'client' => $row->client_display_name ? ['display_name' => $row->client_display_name] : null,
            'vehicle' => $row->vehicle_display_name ? ['display_name' => $row->vehicle_display_name, 'plate_number' => $row->vehicle_plate_number] : null,
        ]);

        $today = CarbonImmutable::now(Contract::OPERATIONS_TIMEZONE)->startOfDay();
        $tomorrow = $today->addDay();
        $afterTomorrow = $today->addDays(2);
        $monthStart = $today->startOfMonth();
        $nextMonth = $monthStart->addMonth();
        $counts = ArchiveService::exclude(DB::table('contracts'), 'contracts')->selectRaw(
            'count(*) filter (where returned = false) as in_rental,
             count(*) filter (where returned = false and return_at is not null and return_at < ?) as overdue,
             count(*) filter (where returned = false and return_at is not null and return_at >= ? and return_at < ?) as due_today,
             count(*) filter (where returned = false and return_at is not null and return_at >= ? and return_at < ?) as due_tomorrow,
             count(*) filter (where returned = false and return_at is not null and return_at >= ? and return_at < ?) as due_after_tomorrow,
             count(*) filter (where returned = false and return_at is not null and return_at >= ? and return_at < ?) as due_month',
            [
                $today->utc(), $today->utc(), $tomorrow->utc(),
                $tomorrow->utc(), $afterTomorrow->utc(),
                $afterTomorrow->utc(), $afterTomorrow->addDay()->utc(),
                $monthStart->utc(), $nextMonth->utc(),
            ],
        )->first();
        $vehicleCounts = DB::table('vehicles')->selectRaw(
            "count(*) filter (where status = 'disponible') as available,
             count(*) filter (where status = 'en_reparation') as in_repair",
        )->first();

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'filters' => $request->only(['q', 'status', 'due', 'date_from', 'date_to', 'sort', 'dir']),
            'counters' => [
                'overdue' => (int) $counts->overdue,
                'due_today' => (int) $counts->due_today,
                'due_tomorrow' => (int) $counts->due_tomorrow,
                'due_after_tomorrow' => (int) $counts->due_after_tomorrow,
                'due_month' => (int) $counts->due_month,
                'in_rental' => (int) $counts->in_rental,
                'available' => (int) $vehicleCounts->available,
                'in_repair' => (int) $vehicleCounts->in_repair,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Contracts/Form', [
            'contract' => null,
            'clients' => [],
            'vehicles' => Vehicle::orderBy('display_name')->get(['id', 'display_name', 'plate_number', 'status']),
            'employees' => Employee::orderBy('display_name')->get(['id', 'display_name']),
            'methods' => ['espece', 'tpe', 'virement', 'cheque', 'en_ligne'],
        ]);
    }

    public function store(Request $request, SequenceService $sequences, AuditService $audit)
    {
        $data = $this->validated($request);
        $paymentAmount = $data['first_payment_amount'] ?? 0;
        $paymentMethod = $data['first_payment_method'] ?? 'espece';
        unset($data['first_payment_amount'], $data['first_payment_method']);
        $data['reference'] = $sequences->next('contracts');
        $data['reference_format'] = 'native_6';
        $data['reference_normalized'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $data['reference']));
        $data['created_by'] = $request->user()->id;
        $data['returned'] = false;

        $contract = DB::transaction(function () use ($data, $request, $paymentAmount, $paymentMethod) {
            $contract = Contract::create($data);

            if ($paymentAmount > 0) {
                Payment::create([
                    'contract_id' => $contract->id,
                    'amount' => $paymentAmount,
                    'payment_method' => $paymentMethod,
                    'payment_status' => 'paye',
                    'created_by' => $request->user()->id,
                ]);
            }

            if ($contract->vehicle_id) {
                Vehicle::whereKey($contract->vehicle_id)->update(['status' => 'en_location']);
            }

            return $contract;
        });

        $audit->log('create', 'contracts', $contract->id, null, $contract->toArray());
        app(\App\Services\NotificationService::class)->notifyAdmins(
            'contract.created',
            'Nouvelle location',
            "{$contract->reference} - ".($contract->client?->display_name ?? 'client non renseignÃ©'),
            ['contract_id' => $contract->id]
        );

        return redirect()->route('contracts.show', $contract)->with('success', 'Location crÃ©Ã©e.');
    }

    public function show(Contract $contract)
    {
        $contract->load(['client', 'vehicle', 'employee', 'firstDriver', 'secondDriver', 'payments', 'documents']);
        $financials = DB::table('v_contract_financials')->where('id', $contract->id)->first();
        $timeline = DB::table('activity_log')
            ->leftJoin('users', 'users.id', '=', 'activity_log.user_id')
            ->leftJoin('payments', 'payments.id', '=', 'activity_log.entity_id')
            ->where(function ($query) use ($contract) {
                $query->where(function ($inner) use ($contract) {
                    $inner->where('activity_log.entity_type', 'contracts')
                        ->where('activity_log.entity_id', $contract->id);
                })->orWhere(function ($inner) use ($contract) {
                    $inner->where('activity_log.entity_type', 'payments')
                        ->where('payments.contract_id', $contract->id);
                });
            })
            ->whereIn('activity_log.action', ['create', 'update', 'return'])
            ->select('activity_log.*', 'users.name as user_name')
            ->orderByDesc('activity_log.created_at')
            ->get();

        return Inertia::render('Contracts/Show', [
            'contract' => $contract,
            'financials' => $financials,
            'documents' => Document::where('documentable_type', 'slv_contrats')->where('documentable_id', $contract->id)->get(),
            'timeline' => $timeline,
        ]);
    }

    public function duplicate(Request $request, Contract $contract, SequenceService $sequences, AuditService $audit)
    {
        $this->authorizeRecord($contract, 'create');
        $data = $contract->toArray();
        unset($data['id'], $data['created_at'], $data['updated_at'], $data['legacy_uid'], $data['legacy_payload']);
        $reference = $sequences->next('contracts');
        $data['reference'] = $reference;
        $data['reference_format'] = 'native_6';
        $data['reference_normalized'] = strtoupper(preg_replace('/[^A-Z0-9]/i', '', $reference));
        $data['returned'] = false;
        $data['created_by'] = $request->user()->id;
        $copy = Contract::create($data);
        $audit->log('duplicate', 'contracts', $copy->id, $contract->toArray(), $copy->toArray());

        return redirect()->route('contracts.show', $copy)->with('success', 'Location dupliquée.');
    }

    public function edit(Contract $contract)
    {
        $this->authorizeRecord($contract, 'update');
        $contract->load(['client', 'firstDriver', 'secondDriver']);
        $clients = collect([$contract->client, $contract->firstDriver, $contract->secondDriver])
            ->filter()
            ->unique('id')
            ->values()
            ->map(fn ($client) => ['id' => $client->id, 'display_name' => $client->display_name, 'phone' => $client->phone]);

        return Inertia::render('Contracts/Form', [
            'contract' => $contract,
            'clients' => $clients,
            'vehicles' => Vehicle::orderBy('display_name')->get(['id', 'display_name', 'plate_number', 'status']),
            'employees' => Employee::orderBy('display_name')->get(['id', 'display_name']),
            'methods' => ['espece', 'tpe', 'virement', 'cheque', 'en_ligne'],
        ]);
    }

    public function update(Request $request, Contract $contract, AuditService $audit)
    {
        $this->authorizeRecord($contract, 'update');
        $data = $this->validated($request, true);
        unset($data['first_payment_amount'], $data['first_payment_method']);
        $before = $contract->toArray();
        $contract->update($data);
        $audit->log('update', 'contracts', $contract->id, $before, $contract->fresh()->toArray());

        return redirect()->route('contracts.show', $contract)->with('success', 'Location mise Ã  jour.');
    }

    public function returnContract(Request $request, Contract $contract, AuditService $audit)
    {
        $this->authorizeRecord($contract, 'update');
        $data = $request->validate([
            'return_km' => ['nullable', 'numeric', 'min:0'],
            'return_at' => ['nullable', 'date'],
        ]);

        $before = $contract->toArray();
        $contract->update([
            'returned' => true,
            'return_km' => $data['return_km'] ?? $contract->return_km,
            'return_at' => $data['return_at'] ?? $contract->return_at,
        ]);

        if ($contract->vehicle_id) {
            Vehicle::whereKey($contract->vehicle_id)->update([
                'status' => 'disponible',
                'km' => $data['return_km'] ?? $contract->return_km,
            ]);
        }

        $audit->log('return', 'contracts', $contract->id, $before, $contract->fresh()->toArray());
        app(\App\Services\NotificationService::class)->notifyAdmins(
            'contract.returned',
            'Retour de voiture',
            "{$contract->reference} - voiture rÃ©ceptionnÃ©",
            ['contract_id' => $contract->id]
        );

        return back()->with('success', 'Retour enregistrÃ©, voiture disponible.');
    }

    public function destroy(Contract $contract, AuditService $audit)
    {
        $this->authorizeRecord($contract, 'delete');
        if ($contract->payments()->exists()) {
            return back()->with('error', 'Suppression refusÃ©e : des paiements sont liÃ©s Ã  cette location.');
        }

        $audit->log('delete', 'contracts', $contract->id, $contract->toArray());
        $contract->delete();

        return redirect()->route('contracts.index')->with('success', 'Location supprimÃ©e.');
    }

    public function pdf(Contract $contract, PdfService $pdf)
    {
        $contract->load(['client', 'vehicle', 'employee', 'firstDriver', 'secondDriver', 'payments']);
        $financials = DB::table('v_contract_financials')->where('id', $contract->id)->first();
        $template = DB::table('contract_templates')->whereNotNull('template_html')->where('template_html', '<>', '')->orderBy('id')->value('template_html');
        $output = $template && str_contains($template, '{{')
            ? $pdf->renderHtml($template, [
                'reference' => $contract->reference,
                'client' => $contract->client?->display_name,
                'vehicle' => $contract->vehicle?->display_name,
                'departure_at' => $contract->departure_at,
                'return_at' => $contract->return_at,
                'total_amount' => $contract->total_amount,
                'paid' => $financials?->paid_amount_calculated,
                'remaining' => $financials?->remaining_calculated,
                'company' => 'TanameCar',
            ])
            : $pdf->render('pdf.contract', [
                'contract' => $contract,
                'financials' => $financials,
                'company' => 'TanameCar',
            ]);

        $safeReference = str_replace(['/', '\\'], '-', $contract->reference);
        $path = "generated/contracts/{$safeReference}.pdf";
        Storage::disk('local')->put($path, $output);
        app(FileStoreService::class)->put($path, $output, 'application/pdf');

        $document = Document::create([
            'documentable_type' => 'slv_contrats',
            'documentable_id' => $contract->id,
            'name' => "{$safeReference}.pdf",
            'path' => $path,
            'mime' => 'application/pdf',
            'size_bytes' => strlen($output),
        ]);

        return response()->download(storage_path("app/private/{$path}"), "{$safeReference}.pdf");
    }

    private function authorizeRecord(Contract $contract, string $action): void
    {
        abort_unless(
            auth()->user()?->canAccessRecord('slv_contrats', $action, $contract),
            403,
            'Action non autorisÃ©e sur cet enregistrement.'
        );
    }

    private function validated(Request $request, bool $partial = false): array
    {
        return $request->validate([
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'client_id' => ['required', 'exists:clients,id'],
            'first_driver_id' => ['nullable', 'exists:clients,id'],
            'second_driver_id' => ['nullable', 'exists:clients,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
            'client_is_main_driver' => ['boolean'],
            'departure_at' => ['required', 'date'],
            'departure_place' => ['nullable', 'string', 'max:255'],
            'departure_km' => ['nullable', 'numeric', 'min:0'],
            'return_at' => ['required', 'date', 'after:departure_at'],
            'return_place' => ['nullable', 'string', 'max:255'],
            'return_km' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['required', 'numeric', 'min:0'],
            'days' => ['required', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'deductible' => ['nullable', 'numeric', 'min:0'],
            'caution_type' => ['nullable', 'in:cheque,visa,passeport'],
            'note' => ['nullable', 'string'],
            'first_payment_amount' => ['nullable', 'numeric', 'min:0'],
            'first_payment_method' => ['nullable', 'in:espece,tpe,virement,cheque,en_ligne'],
        ]);
    }
}

