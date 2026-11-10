<?php

namespace App\Http\Controllers;

use App\Models\AutolocDriverCandidate;
use App\Models\Client;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AutolocMatchingController extends Controller
{
    public function index(Request $request)
    {
        $candidates = AutolocDriverCandidate::query()->orderBy('source_row')->get();
        $clients = Client::query()->get(['id', 'display_name', 'phone', 'address']);
        $normalize = fn (?string $value): string => trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower(@iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string) $value) ?: (string) $value)) ?? '');
        $byPhone = [];
        $byName = [];
        foreach ($clients as $client) {
            $phone = preg_replace('/\D+/', '', (string) $client->phone) ?? '';
            if ($phone !== '') $byPhone[$phone][] = $client;
            $byName[$normalize($client->display_name)][] = $client;
        }
        $lastRentals = DB::table('contracts')->select('client_id')->selectRaw('max(departure_at) as last_departure')->groupBy('client_id')->pluck('last_departure', 'client_id');
        $rows = $candidates->map(function (AutolocDriverCandidate $candidate) use ($byPhone, $byName, $normalize, $lastRentals) {
            $phone = preg_replace('/\D+/', '', (string) $candidate->phone) ?? '';
            $proposals = $phone !== '' && isset($byPhone[$phone]) ? $byPhone[$phone] : ($byName[$normalize($candidate->display_name)] ?? []);
            return [
                'id' => $candidate->id,
                'source_row' => $candidate->source_row,
                'display_name' => $candidate->display_name,
                'phone' => $candidate->phone,
                'address' => $candidate->address,
                'status' => $candidate->status,
                'matched_client_id' => $candidate->matched_client_id,
                'proposals' => collect($proposals)->take(3)->map(fn ($client) => [
                    'id' => $client->id,
                    'display_name' => $client->display_name,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'last_rental' => $lastRentals[$client->id] ?? null,
                ])->values(),
            ];
        });

        return Inertia::render('Clients/AutolocMatching', [
            'rows' => $rows,
            'filters' => $request->only(['status', 'q']),
            'counts' => [
                'total' => $rows->count(),
                'pending' => $rows->where('status', 'pending')->count(),
                'matched' => $rows->where('status', 'matched')->count(),
                'ignored' => $rows->where('status', 'ignored')->count(),
            ],
        ]);
    }

    public function link(Request $request, AutolocDriverCandidate $candidate, AuditService $audit)
    {
        $data = $request->validate(['client_id' => ['required', 'integer', 'exists:clients,id']]);
        $candidate->update(['matched_client_id' => $data['client_id'], 'status' => 'matched', 'modified_by' => $request->user()->id, 'modified_at' => now()]);
        $audit->log('update', 'autoloc_driver_candidates', $candidate->id, null, $candidate->toArray());
        return back()->with('success', 'Conducteur rapproché sans fusion de fiche.');
    }

    public function createClient(Request $request, AutolocDriverCandidate $candidate, AuditService $audit)
    {
        $client = Client::create([
            'display_name' => $candidate->display_name,
            'phone' => $candidate->phone,
            'address' => $candidate->address,
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $request->user()->id,
        ]);
        $candidate->update(['matched_client_id' => $client->id, 'status' => 'matched', 'modified_by' => $request->user()->id, 'modified_at' => now()]);
        $audit->log('create', 'clients', $client->id, null, $client->toArray());
        return back()->with('success', 'Client créé après confirmation.');
    }

    public function ignore(Request $request, AutolocDriverCandidate $candidate)
    {
        $candidate->update(['status' => 'ignored', 'modified_by' => $request->user()->id, 'modified_at' => now()]);
        return back()->with('success', 'Conducteur placé dans la file à valider.');
    }
}
