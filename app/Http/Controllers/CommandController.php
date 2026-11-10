<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class CommandController extends Controller
{
    public function index(Request $request)
    {
        $q = trim($request->string('q')->toString());
        if ($q === '') return response()->json(['results' => []]);
        $results = [];
        Client::where('display_name', 'ilike', "%{$q}%")->orWhere('phone', 'ilike', "%{$q}%")->limit(6)->get(['id', 'display_name', 'phone'])->each(fn ($row) => $results[] = ['label' => $row->display_name, 'hint' => $row->phone, 'href' => "/clients/{$row->id}", 'category' => 'Clients']);
        Contract::where('reference', 'ilike', "%{$q}%")->limit(6)->get(['id', 'reference'])->each(fn ($row) => $results[] = ['label' => $row->reference, 'hint' => 'Location', 'href' => "/contracts/{$row->id}", 'category' => 'Locations']);
        Vehicle::where('display_name', 'ilike', "%{$q}%")->orWhere('plate_number', 'ilike', "%{$q}%")->limit(6)->get(['id', 'display_name', 'plate_number'])->each(fn ($row) => $results[] = ['label' => $row->display_name, 'hint' => $row->plate_number, 'href' => "/vehicles/{$row->id}", 'category' => 'Voitures']);
        Invoice::where('reference', 'ilike', "%{$q}%")->limit(6)->get(['id', 'reference'])->each(fn ($row) => $results[] = ['label' => $row->reference, 'hint' => 'Facture', 'href' => "/invoices/{$row->id}", 'category' => 'Factures']);
        return response()->json(['results' => $results]);
    }
}
