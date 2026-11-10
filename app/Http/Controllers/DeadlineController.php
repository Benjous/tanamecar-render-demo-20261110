<?php

namespace App\Http\Controllers;

use App\Models\VehicleDeadline;
use App\Services\AuditService;
use App\Services\DeadlineService;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeadlineController extends Controller
{
    public function index(Request $request, DeadlineService $service, SearchService $search)
    {
        $query = VehicleDeadline::query()
            ->with(['vehicle.brand', 'vehicle.model', 'vehicle.color', 'maintenanceType', 'completedBy'])
            ->orderByRaw('completed_at is not null')
            ->orderBy('due_date')
            ->orderBy('due_km');

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($q, $search) {
                $search->apply($sub, [
                    'vehicle_deadlines.title',
                    'vehicle_deadlines.due_date',
                    'vehicle_deadlines.due_km',
                    'vehicle_deadlines.completed_at',
                    'vehicle_deadlines.id',
                ], $q);
                $sub->orWhereHas('vehicle', fn ($vehicle) => $search->apply($vehicle, ['display_name', 'plate_number'], $q))
                    ->orWhereHas('maintenanceType', fn ($type) => $search->apply($type, ['name'], $q));
            });
        }
        if ($vehicleId = $request->integer('vehicle_id')) {
            $query->where('vehicle_id', $vehicleId);
        }
        if ($typeId = $request->integer('type_id')) {
            $query->where('maintenance_type_id', $typeId);
        }

        $all = $query->get();
        if ($status = $request->string('status')->toString()) {
            $all = $all->filter(function (VehicleDeadline $deadline) use ($status, $service) {
                return $service->status($deadline)['code'] === $status;
            })->values();
        }

        $rows = $all->map(function (VehicleDeadline $deadline) use ($service) {
            $status = $service->status($deadline);
            return [
                'id' => $deadline->id,
                'title' => $deadline->title,
                'vehicle_id' => $deadline->vehicle_id,
                'vehicle' => $deadline->vehicle?->display_name,
                'plate' => $deadline->vehicle?->plate_number,
                'type' => $deadline->maintenanceType?->name,
                'due_date' => $deadline->due_date?->format('Y-m-d'),
                'due_km' => $deadline->due_km,
                'completed_at' => $deadline->completed_at?->toIso8601String(),
                'completed_by' => $deadline->completedBy?->name,
                'completion_note' => $deadline->completion_note,
                'status' => $status,
            ];
        });

        return Inertia::render('Deadlines/Index', [
            'rows' => $rows,
            'counts' => $service->counts(),
            'filters' => $request->only(['q', 'status', 'vehicle_id', 'type_id']),
            'vehicles' => DB::table('vehicles')->orderBy('display_name')->get(['id', 'display_name', 'plate_number', 'km']),
            'types' => DB::table('maintenance_types')->orderBy('name')->get(['id', 'name']),
            'canUpdate' => $request->user()?->canDo('deadlines', 'update') ?? false,
            'canCreate' => $request->user()?->canDo('deadlines', 'create') ?? false,
            'canManageRules' => (bool) $request->user()?->isAdmin(),
            'rules' => DB::table('deadline_rules')->join('maintenance_types', 'maintenance_types.id', '=', 'deadline_rules.maintenance_type_id')->select('deadline_rules.*', 'maintenance_types.name')->orderBy('maintenance_types.name')->get(),
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'vehicle_id' => ['required', 'exists:vehicles,id'],
            'maintenance_type_id' => ['nullable', 'exists:maintenance_types,id'],
            'title' => ['required', 'string', 'max:120'],
            'due_date' => ['nullable', 'date'],
            'due_km' => ['nullable', 'numeric', 'min:0'],
        ]);
        abort_if(empty($data['due_date']) && empty($data['due_km']), 422, 'Date ou kilométrage requis.');
        $data['created_by'] = $request->user()->id;
        $data['source'] = 'manual';
        $deadline = VehicleDeadline::create($data);
        $audit->log('create', 'vehicle_deadlines', $deadline->id, null, $deadline->toArray());

        return back()->with('success', 'Échéance créée.');
    }

    public function complete(Request $request, VehicleDeadline $deadline, DeadlineService $service, AuditService $audit)
    {
        $data = $request->validate([
            'completed_at' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
            'next_due_date' => ['nullable', 'date'],
            'next_due_km' => ['nullable', 'numeric', 'min:0'],
        ]);
        $service->complete($deadline, $request->user(), $data, $audit);

        return back()->with('success', 'Échéance traitée.');
    }

    public function updateRules(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'rules' => ['required', 'array'],
            'rules.*.maintenance_type_id' => ['required', 'exists:maintenance_types,id'],
            'rules.*.alert_days' => ['required', 'integer', 'min:0', 'max:365'],
            'rules.*.alert_km' => ['required', 'numeric', 'min:0'],
        ]);
        foreach ($data['rules'] as $rule) {
            DB::table('deadline_rules')->updateOrInsert(
                ['maintenance_type_id' => $rule['maintenance_type_id']],
                ['alert_days' => $rule['alert_days'], 'alert_km' => $rule['alert_km'], 'updated_at' => now(), 'created_at' => now()],
            );
        }
        $audit->log('update', 'deadline_rules', null, null, $data);

        return back()->with('success', 'Seuils enregistrés.');
    }
}
