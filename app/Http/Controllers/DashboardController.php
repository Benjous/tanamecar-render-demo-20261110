<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = CarbonImmutable::now('Africa/Casablanca');
        $from = $request->date('from')
            ? CarbonImmutable::parse($request->date('from'))->startOfDay()
            : $today->subMonths(11)->startOfMonth();
        $to = $request->date('to')
            ? CarbonImmutable::parse($request->date('to'))->endOfDay()
            : $today->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->startOfDay(), $from->endOfDay()];
        }

        $filters = [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'status' => trim($request->string('status')->toString()),
            'category_id' => $request->integer('category_id') ?: null,
            'model_id' => $request->integer('model_id') ?: null,
            'vehicle_id' => $request->integer('vehicle_id') ?: null,
        ];

        $vehicleQuery = Vehicle::query()->with(['brand:id,name', 'model:id,name', 'category:id,name']);
        if ($filters['status'] === 'sous_location') {
            $vehicleQuery->where('operating_mode', 'sous_location');
        } elseif ($filters['status'] !== '') {
            $vehicleQuery->where('status', $filters['status']);
        }
        if ($filters['category_id']) {
            $vehicleQuery->where('category_id', $filters['category_id']);
        }
        if ($filters['model_id']) {
            $vehicleQuery->where('model_id', $filters['model_id']);
        }
        if ($filters['vehicle_id']) {
            $vehicleQuery->whereKey($filters['vehicle_id']);
        }

        $vehicles = $vehicleQuery->orderBy('display_name')->get();
        $vehicleIds = $vehicles->pluck('id')->all();
        $fleetTotal = Vehicle::query()->count();

        $allContracts = Contract::query()
            ->with(['client:id,display_name', 'vehicle:id,display_name,plate_number,status,operating_mode'])
            ->whereIn('vehicle_id', $vehicleIds)
            ->get();

        $periodContracts = $allContracts
            ->filter(fn (Contract $contract) => $contract->departure_at
                && CarbonImmutable::parse($contract->departure_at)->betweenIncluded($from, $to))
            ->values();

        $activeContracts = $allContracts->filter(fn (Contract $contract) => ! $contract->returned && $contract->departure_at && $contract->return_at
            && CarbonImmutable::parse($contract->departure_at)->lessThanOrEqualTo($today)
            && CarbonImmutable::parse($contract->return_at)->greaterThanOrEqualTo($today))->count();
        $overdueContracts = $allContracts->filter(fn (Contract $contract) => ! $contract->returned && $contract->return_at
            && CarbonImmutable::parse($contract->return_at)->lessThan($today->startOfDay()))->count();
        $dueToday = $allContracts->filter(fn (Contract $contract) => ! $contract->returned && $contract->return_at
            && CarbonImmutable::parse($contract->return_at)->isSameDay($today))->count();
        $dueTomorrow = $allContracts->filter(fn (Contract $contract) => ! $contract->returned && $contract->return_at
            && CarbonImmutable::parse($contract->return_at)->isSameDay($today->addDay()))->count();

        $periodContractIds = $periodContracts->pluck('id')->all();
        $periodPayments = DB::table('payments')
            ->whereIn('contract_id', $periodContractIds)
            ->whereBetween('created_at', [$from, $to])
            ->get();

        $invoiceQuery = DB::table('invoices')
            ->whereDate('issued_at', '>=', $from->toDateString())
            ->whereDate('issued_at', '<=', $to->toDateString());
        if ($filters['vehicle_id'] || $filters['category_id'] || $filters['model_id'] || $filters['status'] !== '') {
            $invoiceQuery->whereIn('file_reference', $periodContracts->pluck('reference')->all());
        }
        $periodInvoices = $invoiceQuery->get();

        $periodCharges = (float) DB::table('charges')
            ->whereDate('charge_date', '>=', $from->toDateString())
            ->whereDate('charge_date', '<=', $to->toDateString())
            ->sum('amount');

        $statusCounts = [
            'disponible' => $vehicles->filter(fn (Vehicle $vehicle) => $vehicle->status === 'disponible' && $vehicle->operating_mode !== 'sous_location')->count(),
            'en_location' => $vehicles->filter(fn (Vehicle $vehicle) => $vehicle->status === 'en_location' && $vehicle->operating_mode !== 'sous_location')->count(),
            'sous_location' => $vehicles->filter(fn (Vehicle $vehicle) => $vehicle->operating_mode === 'sous_location' || $vehicle->status === 'sous_location')->count(),
            'en_reparation' => $vehicles->filter(fn (Vehicle $vehicle) => $vehicle->status === 'en_reparation')->count(),
        ];
        $knownStatuses = array_sum($statusCounts);
        $statusCounts['immobilise'] = max(0, $vehicles->count() - $knownStatuses);
        $statusCounts['total'] = $vehicles->count();
        $statusCounts['hors_sous_location'] = max(1, $vehicles->count() - $statusCounts['sous_location']);

        $utilization = $statusCounts['hors_sous_location'] > 0
            ? round(($statusCounts['en_location'] / $statusCounts['hors_sous_location']) * 100, 1)
            : 0.0;

        $periodDays = max(1, $from->diffInDays($to) + 1);
        $performanceByVehicle = $periodContracts->groupBy('vehicle_id')->map(function ($contracts, $vehicleId) use ($periodDays) {
            $days = (float) $contracts->sum('days');
            $revenue = (float) $contracts->sum('total_amount');

            return [
                'contracts' => $contracts->count(),
                'days' => $days,
                'revenue' => $revenue,
                'utilization' => min(100, round(($days / $periodDays) * 100, 1)),
            ];
        });

        $vehiclePerformance = $vehicles->map(function (Vehicle $vehicle) use ($performanceByVehicle) {
            $performance = $performanceByVehicle->get($vehicle->id, ['contracts' => 0, 'days' => 0, 'revenue' => 0, 'utilization' => 0]);

            return [
                'id' => $vehicle->id,
                'display_name' => $vehicle->display_name,
                'plate_number' => $vehicle->plate_number,
                'brand' => $vehicle->brand?->name,
                'model' => $vehicle->model?->name,
                'category' => $vehicle->category?->name,
                'status' => $vehicle->operating_mode === 'sous_location' ? 'sous_location' : $vehicle->status,
                'operating_mode' => $vehicle->operating_mode,
                'contracts' => $performance['contracts'],
                'days' => $performance['days'],
                'revenue' => $performance['revenue'],
                'utilization' => $performance['utilization'],
            ];
        })->sortByDesc(fn ($row) => ($row['revenue'] * 1000000) + $row['contracts'])->values();

        $monthly = [];
        $cursor = $from->startOfMonth();
        $lastMonth = $to->startOfMonth();
        while ($cursor->lessThanOrEqualTo($lastMonth)) {
            $key = $cursor->format('Y-m');
            $monthContracts = $periodContracts->filter(fn (Contract $contract) => $contract->departure_at
                && CarbonImmutable::parse($contract->departure_at)->format('Y-m') === $key);
            $monthPayments = $periodPayments->filter(fn ($payment) => CarbonImmutable::parse($payment->created_at)->format('Y-m') === $key);
            $monthly[] = [
                'key' => $key,
                'label' => $cursor->locale('fr')->isoFormat('MM/YY'),
                'contracts' => $monthContracts->count(),
                'days' => (float) $monthContracts->sum('days'),
                'revenue' => (float) $monthContracts->sum('total_amount'),
                'payments' => (float) $monthPayments->sum('amount'),
            ];
            $cursor = $cursor->addMonth();
        }

        $categories = DB::table('vehicle_categories')->orderBy('name')->get(['id', 'name']);
        $models = DB::table('vehicle_models')->orderBy('name')->get(['id', 'name']);
        $vehicleOptions = Vehicle::query()->orderBy('display_name')->get(['id', 'display_name', 'plate_number']);

        $revenue = (float) $periodContracts->sum('total_amount');
        $paid = (float) $periodPayments->sum('amount');
        $invoiced = (float) $periodInvoices->sum('total');
        $remaining = max(0, $revenue - $paid);

        return Inertia::render('Dashboard', [
            'filters' => $filters,
            'filterOptions' => [
                'categories' => $categories,
                'models' => $models,
                'vehicles' => $vehicleOptions,
            ],
            'kpis' => [
                'fleet_total' => $fleetTotal,
                'filtered_total' => $statusCounts['total'],
                'available' => $statusCounts['disponible'],
                'in_rental' => $statusCounts['en_location'],
                'in_sub_rental' => $statusCounts['sous_location'],
                'in_repair' => $statusCounts['en_reparation'],
                'immobilized' => $statusCounts['immobilise'],
                'utilization' => $utilization,
                'active_contracts' => $activeContracts,
                'overdue' => $overdueContracts,
                'due_today' => $dueToday,
                'due_tomorrow' => $dueTomorrow,
                'period_contracts' => $periodContracts->count(),
                'period_days' => (float) $periodContracts->sum('days'),
                'revenue' => $revenue,
                'paid' => $paid,
                'invoiced' => $invoiced,
                'remaining' => $remaining,
                'charges' => $periodCharges,
                'maintenance_cost' => null,
                'period_days_count' => $periodDays,
            ],
            'statusCounts' => $statusCounts,
            'monthly' => $monthly,
            'vehiclePerformance' => $vehiclePerformance,
            'periodLabel' => $from->format('d/m/Y').' - '.$to->format('d/m/Y'),
            'counters' => [
                'overdue' => $overdueContracts,
                'due_today' => $dueToday,
                'due_tomorrow' => $dueTomorrow,
                'due_after_tomorrow' => $allContracts->filter(fn (Contract $contract) => ! $contract->returned && $contract->return_at
                    && CarbonImmutable::parse($contract->return_at)->isSameDay($today->addDays(2)))->count(),
                'due_month' => Contract::query()->dueBucket('month')->count(),
                'in_rental' => Contract::query()->inRental()->count(),
                'available' => Vehicle::query()->available()->count(),
                'in_repair' => Vehicle::query()->inRepair()->count(),
            ],
            'counts' => [
                'clients' => DB::table('clients')->count(),
                'vehicles' => DB::table('vehicles')->count(),
                'contracts' => DB::table('contracts')->count(),
                'invoices' => DB::table('invoices')->count(),
            ],
            'stats' => [
                'revenue_trend' => null,
                'occupancy' => $utilization,
                'returns_month' => Contract::query()->dueBucket('month')->count(),
            ],
            'vehiclesByStatus' => $statusCounts,
        ]);
    }
}
