<?php

namespace App\Http\Controllers;

use App\Models\SubRental;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubRentalController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = SubRental::query()->with('vehicle:id,display_name,plate_number');
        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($builder) use ($q, $search) {
                $search->apply($builder, [
                    'sub_rentals.client_name',
                    'sub_rentals.vehicle_name',
                    'sub_rentals.company',
                    'sub_rentals.source_id',
                    'sub_rentals.source_row',
                    'sub_rentals.days_recorded',
                    'sub_rentals.rate_recorded',
                    'sub_rentals.total_recorded',
                    'sub_rentals.price_recorded',
                    'sub_rentals.profit_recorded',
                    'sub_rentals.advance_recorded',
                    'sub_rentals.credit_recorded',
                ], $q);
                $builder->orWhereHas('vehicle', fn ($vehicle) => $search->apply($vehicle, ['display_name', 'plate_number'], $q));
            });
        }
        if ($match = $request->string('match')->toString()) {
            if ($match === 'matched') {
                $query->whereNotNull('vehicle_id');
            } elseif ($match === 'unmatched') {
                $query->whereNull('vehicle_id');
            }
        }
        $totalsQuery = clone $query;
        $countsQuery = clone $query;
        $rows = $query->orderBy('source_row')->get();

        $total = (float) $totalsQuery->sum('total_recorded');
        $priceQuery = clone $totalsQuery;
        $price = (float) $priceQuery->sum('price_recorded');
        $profitQuery = clone $totalsQuery;
        $profit = (float) $profitQuery->sum('profit_recorded');
        $advanceQuery = clone $totalsQuery;
        $advance = (float) $advanceQuery->sum('advance_recorded');
        $creditQuery = clone $totalsQuery;
        $credit = (float) $creditQuery->sum('credit_recorded');
        $totalRowsQuery = clone $countsQuery;
        $totalRows = $totalRowsQuery->count();
        $matchedRowsQuery = clone $countsQuery;
        $matchedRows = $matchedRowsQuery->whereNotNull('vehicle_id')->count();

        return Inertia::render('SubRentals/Index', [
            'rows' => $rows,
            'filters' => $request->only(['q', 'match']),
            'totals' => [
                'total' => round($total, 2),
                'price' => round($price, 2),
                'profit' => round($profit, 2),
                'advance' => round($advance, 2),
                'credit' => round($credit, 2),
            ],
            'documentedGap' => 7312,
            'counts' => ['total' => $totalRows, 'matched' => $matchedRows],
        ]);
    }

    public function show(SubRental $subRental)
    {
        $subRental->load(['vehicle:id,display_name,plate_number', 'modifiedBy:id,name']);
        $totalCalculated = $subRental->days_current !== null && $subRental->rate_current !== null ? round((float) $subRental->days_current * (float) $subRental->rate_current, 8) : null;
        $profitCalculated = $subRental->price_current !== null && $totalCalculated !== null ? round((float) $subRental->price_current - $totalCalculated, 8) : null;
        $creditCalculated = $subRental->price_current !== null && $subRental->advance_current !== null ? round((float) $subRental->price_current - (float) $subRental->advance_current, 8) : null;

        return Inertia::render('SubRentals/Show', [
            'row' => $subRental,
            'calculated' => ['total' => $totalCalculated, 'profit' => $profitCalculated, 'credit' => $creditCalculated],
            'canUpdate' => request()->user()->canAccessRecord('sub_rentals', 'update', $subRental),
        ]);
    }

    public function update(Request $request, SubRental $subRental)
    {
        abort_unless($request->user()->canAccessRecord('sub_rentals', 'update', $subRental), 403);
        $data = $request->validate([
            'days_current' => ['nullable', 'numeric', 'min:0'],
            'rate_current' => ['nullable', 'numeric', 'min:0'],
            'total_current' => ['nullable', 'numeric'],
            'price_current' => ['nullable', 'numeric'],
            'profit_current' => ['nullable', 'numeric'],
            'advance_current' => ['nullable', 'numeric'],
            'credit_current' => ['nullable', 'numeric'],
        ]);
        $subRental->update([...$data, 'modified_by' => $request->user()->id, 'modified_at' => now()]);
        return redirect()->route('sub-rentals.show', $subRental)->with('success', 'Sous-location mise à jour.');
    }
}
