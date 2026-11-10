<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->string('q')->toString());
        $results = ['contracts' => [], 'clients' => [], 'vehicles' => [], 'invoices' => []];

        if ($q !== '') {
            $results['contracts'] = Contract::with(['client', 'vehicle'])
                ->where('reference', 'ilike', "%{$q}%")
                ->orWhereHas('client', fn ($c) => $c->where('display_name', 'ilike', "%{$q}%"))
                ->orWhereHas('vehicle', fn ($v) => $v->where('plate_number', 'ilike', "%{$q}%"))
                ->get();

            $results['clients'] = Client::where('display_name', 'ilike', "%{$q}%")
                ->orWhere('phone', 'ilike', "%{$q}%")
                ->orWhere('email', 'ilike', "%{$q}%")
                ->get();

            $results['vehicles'] = Vehicle::where('display_name', 'ilike', "%{$q}%")
                ->orWhere('plate_number', 'ilike', "%{$q}%")
                ->get();

            $results['invoices'] = Invoice::with('client')
                ->where('reference', 'ilike', "%{$q}%")
                ->orWhere('file_reference', 'ilike', "%{$q}%")
                ->get();
        }

        return Inertia::render('Search/Index', [
            'q' => $q,
            'results' => $results,
        ]);
    }
}

