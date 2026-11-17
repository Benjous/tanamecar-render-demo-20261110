<?php

namespace App\Http\Controllers;

use App\Models\SubRental;
use App\Models\Vehicle;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubRentalController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = Vehicle::query()
            ->with([
                'lessor:id,name',
                'brand:id,name',
                'model:id,name',
                'category:id,name',
                'contracts' => fn ($contracts) => $contracts->where('returned', false)->orderByDesc('departure_at'),
                'contracts.client:id,display_name',
            ])
            ->where('operating_mode', 'sous_location');

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($builder) use ($q) {
                $builder->where('vehicles.display_name', 'ilike', "%{$q}%")
                    ->orWhere('vehicles.plate_number', 'ilike', "%{$q}%")
                    ->orWhereHas('lessor', fn ($lessor) => $lessor->where('name', 'ilike', "%{$q}%"));
            });
        }
        if ($numero = trim($request->string('numero')->toString())) {
            if (ctype_digit($numero)) {
                $query->whereKey((int) $numero);
            }
        }
        if ($voiture = trim($request->string('voiture')->toString())) {
            $query->where(function ($builder) use ($voiture) {
                $builder->where('vehicles.display_name', 'ilike', "%{$voiture}%")
                    ->orWhere('vehicles.plate_number', 'ilike', "%{$voiture}%");
            });
        }
        if ($societe = trim($request->string('societe')->toString())) {
            $query->whereHas('lessor', fn ($lessor) => $lessor->where('name', 'ilike', "%{$societe}%"));
        }
        if ($statut = trim($request->string('statut')->toString())) {
            $query->where('vehicles.status', $statut);
        }

        $vehicles = $query->orderBy('display_name')->get();

        $rows = $vehicles->map(function (Vehicle $vehicle) {
            $contract = $vehicle->contracts->first();

            return [
                'id' => $vehicle->id,
                'vehicle_name' => $vehicle->display_name,
                'plate_number' => $vehicle->plate_number,
                'company' => $vehicle->lessor?->name,
                'status' => $vehicle->status,
                'operating_mode' => $vehicle->operating_mode,
                'daily_rate' => $vehicle->daily_rate,
                'km' => $vehicle->km,
                'brand' => $vehicle->brand?->name,
                'model' => $vehicle->model?->name,
                'category' => $vehicle->category?->name,
                'contract_reference' => $contract?->reference,
                'client_name' => $contract?->client?->display_name,
                'return_at' => $contract?->return_at,
            ];
        })->values();

        return Inertia::render('SubRentals/Index', [
            'rows' => $rows,
            'filters' => $request->only(['q', 'numero', 'voiture', 'societe', 'statut']),
            'counts' => [
                'total' => $rows->count(),
                'in_contract' => $rows->filter(fn ($row) => $row['contract_reference'] !== null)->count(),
            ],
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
