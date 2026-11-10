<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Color;
use App\Models\Vehicle;
use App\Models\VehicleDeadline;
use App\Models\VehicleCategory;
use App\Models\VehicleModel;
use App\Services\AuditService;
use App\Services\DeadlineService;
use App\Services\SearchService;
use App\Services\TimelineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = Vehicle::query()
            ->with(['brand:id,name', 'model:id,name', 'color:id,name', 'category:id,name'])
            ->select('id', 'display_name', 'plate_number', 'status', 'operating_mode', 'km', 'daily_rate', 'brand_id', 'model_id', 'color_id', 'category_id');

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($q, $search) {
                $search->apply($sub, [
                    'vehicles.display_name',
                    'vehicles.plate_number',
                    'vehicles.chassis_number',
                    'vehicles.cpi_ww',
                    'vehicles.km',
                    'vehicles.daily_rate',
                    'vehicles.id',
                ], $q);
                $sub->orWhereHas('brand', fn ($brand) => $search->apply($brand, ['name'], $q))
                    ->orWhereHas('model', fn ($model) => $search->apply($model, ['name'], $q))
                    ->orWhereHas('category', fn ($category) => $search->apply($category, ['name'], $q));
            });
        }
        if ($brandId = $request->integer('brand_id')) {
            $query->where('brand_id', $brandId);
        }
        if ($categoryId = $request->integer('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($status = $request->string('status')->toString()) {
            if ($status === 'disponible') {
                $query->available();
            } else {
                $query->where('status', $status);
            }
        }
        if ($mode = $request->string('mode')->toString()) {
            if ($mode === 'sous_location') {
                $query->sousLocation();
            } elseif ($mode === 'location') {
                $query->locationMode();
            } else {
                $query->where('operating_mode', $mode);
            }
        }

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $query->orderBy('display_name')->get(),
            'filters' => $request->only(['q', 'status', 'mode', 'brand_id', 'category_id']),
            'brands' => Brand::orderBy('name')->get(['id', 'name']),
            'categories' => VehicleCategory::orderBy('name')->get(['id', 'name']),
            'counters' => [
                'sous_location' => Vehicle::query()->sousLocation()->count(),
                'available' => Vehicle::query()->available()->count(),
                'location' => Vehicle::query()->locationMode()->count(),
            ],
        ]);
    }

    public function show(Vehicle $vehicle)
    {
        $vehicle->load(['brand', 'model', 'color', 'category', 'lessor', 'creditHouse', 'contracts.client']);
        $service = app(DeadlineService::class);
        $deadlines = VehicleDeadline::query()->with('maintenanceType')->where('vehicle_id', $vehicle->id)->orderByRaw('completed_at is not null')->orderBy('due_date')->orderBy('due_km')->get()->map(function ($deadline) use ($service, $vehicle) {
            return [
                'id' => $deadline->id,
                'vehicle_id' => $deadline->vehicle_id,
                'vehicle' => $vehicle->display_name,
                'plate' => $vehicle->plate_number,
                'title' => $deadline->title,
                'type' => $deadline->maintenanceType?->name,
                'due_date' => $deadline->due_date?->format('Y-m-d'),
                'due_km' => $deadline->due_km,
                'completed_at' => $deadline->completed_at?->toIso8601String(),
                'completed_by' => null,
                'completion_note' => $deadline->completion_note,
                'status' => $service->status($deadline),
            ];
        });

        return Inertia::render('Vehicles/Show', ['vehicle' => $vehicle, 'timeline' => app(TimelineService::class)->forVehicle($vehicle->id), 'deadlines' => $deadlines, 'canUpdateDeadlines' => auth()->user()?->canDo('deadlines', 'update') ?? false]);
    }

    public function create()
    {
        return Inertia::render('Vehicles/Form', $this->formData());
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $this->validated($request);
        $data['created_by'] = $request->user()->id;
        $vehicle = Vehicle::create($data);
        $audit->log('create', 'vehicles', $vehicle->id, null, $vehicle->toArray());

        return redirect()->route('vehicles.show', $vehicle)->with('success', 'Voiture crÃ©Ã©.');
    }

    public function archive(Request $request, Vehicle $vehicle, AuditService $audit)
    {
        $batch = 'vehicle-archive-'.now()->format('YmdHis');
        DB::table('archived_records')->insertOrIgnore([
            'entity_type' => 'vehicles',
            'record_id' => $vehicle->id,
            'batch_id' => $batch,
            'business_date' => now()->toDateString(),
            'archived_by' => $request->user()->id,
            'created_at' => now(),
        ]);
        $audit->log('archive', 'vehicles', $vehicle->id, $vehicle->toArray());

        return redirect()->route('vehicles.index')->with('success', 'Voiture archivÃ©e.');
    }

    public function edit(Vehicle $vehicle)
    {
        return Inertia::render('Vehicles/Form', ['vehicle' => $vehicle] + $this->formData());
    }

    public function update(Request $request, Vehicle $vehicle, AuditService $audit)
    {
        $data = $this->validated($request);
        $before = $vehicle->toArray();
        $vehicle->update($data);
        $audit->log('update', 'vehicles', $vehicle->id, $before, $vehicle->fresh()->toArray());

        return redirect()->route('vehicles.show', $vehicle)->with('success', 'Voiture mis Ã  jour.');
    }

    public function destroy(Vehicle $vehicle, AuditService $audit)
    {
        if ($vehicle->contracts()->exists()) {
            return back()->with('error', 'Suppression refusÃ©e : des locations sont liÃ©es Ã  ce voiture.');
        }
        $audit->log('delete', 'vehicles', $vehicle->id, $vehicle->toArray());
        $vehicle->delete();

        return redirect()->route('vehicles.index')->with('success', 'Voiture supprimÃ©.');
    }

    private function formData(): array
    {
        return [
            'brands' => Brand::orderBy('name')->get(['id', 'name']),
            'models' => VehicleModel::orderBy('name')->get(['id', 'name', 'brand_id']),
            'colors' => Color::orderBy('name')->get(['id', 'name', 'hex']),
            'categories' => VehicleCategory::orderBy('name')->get(['id', 'name']),
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'in:en_location,disponible,en_reparation,hors_service'],
            'operating_mode' => ['required', 'in:location,sous_location,service'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'model_id' => ['nullable', 'exists:vehicle_models,id'],
            'color_id' => ['nullable', 'exists:colors,id'],
            'category_id' => ['nullable', 'exists:vehicle_categories,id'],
            'plate_number' => ['nullable', 'string', 'max:32'],
            'cpi_ww' => ['nullable', 'string', 'max:32'],
            'first_registration_date' => ['nullable', 'date'],
            'fiscal_power' => ['nullable', 'numeric', 'min:0'],
            'fuel_type' => ['nullable', 'in:Diesel,Essence,Hybrid,electrique'],
            'gearbox' => ['nullable', 'in:Automatique,Manuel'],
            'chassis_number' => ['nullable', 'string'],
            'km' => ['nullable', 'numeric', 'min:0'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'daily_rate' => ['nullable', 'numeric', 'min:0'],
            'credit_months' => ['nullable', 'numeric', 'min:0'],
            'credit_down_payment' => ['nullable', 'numeric', 'min:0'],
            'monthly_installment' => ['nullable', 'numeric', 'min:0'],
            'credit_due_date' => ['nullable', 'date'],
        ]);
    }
}

