<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Vehicle;
use App\Services\ArchiveService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $counters = [
            'overdue' => Contract::query()->overdue()->count(),
            'due_today' => Contract::query()->dueBucket('today')->count(),
            'due_tomorrow' => Contract::query()->dueBucket('tomorrow')->count(),
            'due_after_tomorrow' => Contract::query()->dueBucket('after_tomorrow')->count(),
            'in_rental' => Contract::query()->inRental()->count(),
            'available' => Vehicle::query()->available()->count(),
            'in_repair' => Vehicle::query()->inRepair()->count(),
        ];
        $revenue = (float) ArchiveService::exclude(DB::table('invoices'), 'invoices')->sum('total');
        $payments = (float) ArchiveService::exclude(DB::table('payments'), 'payments')->sum('amount');
        $contractsTotal = (float) ArchiveService::exclude(DB::table('contracts'), 'contracts')->sum('total_amount');

        $recent = Contract::with(['client', 'vehicle'])
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $upcoming = Contract::with(['client', 'vehicle'])
            ->where('returned', false)
            ->whereBetween('return_at', [now(), now()->addDays(7)])
            ->orderBy('return_at')
            ->limit(8)
            ->get();

        $vehiclesByStatus = DB::table('vehicles')
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $monthStart = CarbonImmutable::now()->startOfMonth();
        $previousMonthStart = $monthStart->subMonth();
        $invoiceBase = ArchiveService::exclude(DB::table('invoices'), 'invoices');
        $currentMonthQuery = clone $invoiceBase;
        $currentMonth = (float) $currentMonthQuery
            ->whereNotNull('issued_at')
            ->where('issued_at', '>=', $monthStart)
            ->sum('total');
        $previousMonthQuery = clone $invoiceBase;
        $previousMonth = (float) $previousMonthQuery
            ->whereNotNull('issued_at')
            ->where('issued_at', '>=', $previousMonthStart)
            ->where('issued_at', '<', $monthStart)
            ->sum('total');
        $revenueTrend = $previousMonth > 0 ? round((($currentMonth - $previousMonth) / $previousMonth) * 100, 1) : null;
        $occupancy = $counters['available'] + $counters['in_rental'] + $counters['in_repair'] > 0
            ? round(($counters['in_rental'] / max(1, $counters['available'] + $counters['in_rental'] + $counters['in_repair'])) * 100, 1)
            : 0.0;

        return Inertia::render('Dashboard', [
            'counters' => $counters,
            'revenue' => $revenue,
            'payments' => $payments,
            'contractsTotal' => $contractsTotal,
            'recent' => $recent,
            'upcoming' => $upcoming,
            'vehiclesByStatus' => $vehiclesByStatus,
            'counts' => [
                'clients' => DB::table('clients')->count(),
                'vehicles' => DB::table('vehicles')->count(),
                'contracts' => DB::table('contracts')->count(),
                'invoices' => DB::table('invoices')->count(),
            ],
            'stats' => [
                'revenue_trend' => $revenueTrend,
                'occupancy' => $occupancy,
                'returns_month' => Contract::query()->dueBucket('month')->count(),
            ],
        ]);
    }
}
