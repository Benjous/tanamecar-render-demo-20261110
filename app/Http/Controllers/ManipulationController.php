<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ManipulationController extends Controller
{
    public function index()
    {
        $available = Vehicle::query()->available()->orderBy('display_name')->get(['id', 'display_name', 'plate_number', 'status']);
        $unsettled = DB::table('contracts')
            ->leftJoin('clients', 'clients.id', '=', 'contracts.client_id')
            ->leftJoin('v_contract_financials as f', 'f.id', '=', 'contracts.id')
            ->where('f.remaining_calculated', '>', 0)
            ->orderByDesc('f.remaining_calculated')
            ->limit(50)
            ->get(['contracts.id', 'contracts.reference', 'contracts.return_at', 'clients.display_name as client_name', 'f.remaining_calculated']);

        return Inertia::render('Manipulation/Index', [
            'counts' => [
                'available' => $available->count(),
                'in_rental' => Contract::query()->inRental()->count(),
                'overdue' => Contract::query()->overdue()->count(),
                'unsettled' => $unsettled->count(),
            ],
            'available' => $available->take(30),
            'unsettled' => $unsettled,
        ]);
    }
}
