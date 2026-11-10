<?php

namespace App\Http\Controllers;

use App\Models\VehicleAmortization;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleAmortizationController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = VehicleAmortization::query()->with('vehicle:id,display_name,plate_number');
        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($builder) use ($q, $search) {
                $search->apply($builder, [
                    'vehicle_amortizations.source_credit_id',
                    'vehicle_amortizations.source_vehicle_name',
                    'vehicle_amortizations.source_plate',
                    'vehicle_amortizations.revenue_recorded',
                    'vehicle_amortizations.credit_recorded',
                    'vehicle_amortizations.balance_recorded',
                    'vehicle_amortizations.price_recorded',
                ], $q);
                $builder->orWhereHas('vehicle', fn ($vehicle) => $search->apply($vehicle, ['display_name', 'plate_number'], $q));
            });
        }
        if ($request->string('match')->toString() === 'unmatched') {
            $query->whereNull('vehicle_id');
        } elseif ($request->string('match')->toString() === 'matched') {
            $query->whereNotNull('vehicle_id');
        }
        $totalsQuery = clone $query;
        $countsQuery = clone $query;
        $rows = $query->orderBy('source_vehicle_name')->get();

        $revenueQuery = clone $totalsQuery;
        $creditQuery = clone $totalsQuery;
        $balanceQuery = clone $totalsQuery;
        $priceQuery = clone $totalsQuery;
        $remainingQuery = clone $totalsQuery;
        $netRemainingQuery = clone $totalsQuery;
        $totalQuery = clone $countsQuery;
        $matchedQuery = clone $countsQuery;
        $unmatchedQuery = clone $countsQuery;

        return Inertia::render('VehicleAmortizations/Index', [
            'amortizations' => $rows,
            'filters' => $request->only(['q', 'match']),
            'totals' => [
                'revenue' => round((float) $revenueQuery->sum('revenue_recorded'), 2),
                'credit' => round((float) $creditQuery->sum('credit_recorded'), 2),
                'balance' => round((float) $balanceQuery->sum('balance_recorded'), 2),
                'price' => round((float) $priceQuery->sum('price_recorded'), 2),
                'remaining' => round((float) $remainingQuery->sum('remaining_recorded'), 2),
                'net_remaining' => round((float) $netRemainingQuery->sum('net_remaining_recorded'), 2),
            ],
            'counts' => [
                'total' => $totalQuery->count(),
                'matched' => $matchedQuery->whereNotNull('vehicle_id')->count(),
                'unmatched' => $unmatchedQuery->whereNull('vehicle_id')->count(),
            ],
        ]);
    }

    public function show(VehicleAmortization $amortization)
    {
        $amortization->load(['vehicle:id,display_name,plate_number', 'modifiedBy:id,name']);
        $calculated = $amortization->revenue_recorded !== null && $amortization->credit_recorded !== null
            ? round((float) $amortization->revenue_recorded - (float) $amortization->credit_recorded, 8)
            : null;
        $recorded = $amortization->balance_recorded !== null ? (float) $amortization->balance_recorded : null;

        return Inertia::render('VehicleAmortizations/Show', [
            'amortization' => $amortization,
            'calculated' => ['balance' => $calculated],
            'difference' => $calculated !== null && $recorded !== null ? round($calculated - $recorded, 8) : null,
            'canUpdate' => request()->user()->canAccessRecord('vehicle_amortizations', 'update', $amortization),
        ]);
    }

    public function update(Request $request, VehicleAmortization $amortization)
    {
        abort_unless($request->user()->canAccessRecord('vehicle_amortizations', 'update', $amortization), 403);
        $data = $request->validate([
            'revenue_current' => ['nullable', 'numeric'],
            'credit_current' => ['nullable', 'numeric'],
            'balance_current' => ['nullable', 'numeric'],
            'objective_current' => ['nullable', 'numeric'],
            'price_per_km_current' => ['nullable', 'numeric'],
            'price_current' => ['nullable', 'numeric'],
            'real_cost_current' => ['nullable', 'numeric'],
            'remaining_current' => ['nullable', 'numeric'],
            'net_remaining_current' => ['nullable', 'numeric'],
        ]);
        $amortization->update([...$data, 'modified_by' => $request->user()->id, 'modified_at' => now()]);

        return redirect()->route('vehicle-amortizations.show', $amortization)->with('success', 'Amortissement mis à jour.');
    }
}
