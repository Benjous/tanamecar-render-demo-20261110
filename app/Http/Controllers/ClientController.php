<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Country;
use App\Models\LeadSource;
use App\Models\Media;
use App\Services\AuditService;
use App\Services\FileStoreService;
use App\Services\SearchService;
use App\Services\TimelineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = DB::table('clients')
            ->leftJoinSub(
                DB::table('contracts')->selectRaw('client_id, count(*) as contracts_count')->groupBy('client_id'),
                'contract_counts',
                'contract_counts.client_id',
                '=',
                'clients.id',
            )
            ->select('clients.id', 'clients.display_name', 'clients.client_type', 'clients.status', 'clients.phone', 'clients.email', 'clients.address', 'clients.identity_number', 'clients.created_at')
            ->selectRaw('coalesce(contract_counts.contracts_count, 0) as contracts_count');

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $search->apply($query, [
                'clients.display_name',
                'clients.first_name',
                'clients.last_name',
                'clients.phone',
                'clients.email',
                'clients.address',
                'clients.identity_number',
                'clients.id',
            ], $q);
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('clients.status', $status);
        }
        if ($type = $request->string('type')->toString()) {
            $query->where('clients.client_type', $type);
        }
        if ($nom = trim($request->string('nom')->toString())) {
            $query->where('clients.last_name', 'ilike', "%{$nom}%");
        }
        if ($prenom = trim($request->string('prenom')->toString())) {
            $query->where('clients.first_name', 'ilike', "%{$prenom}%");
        }
        if ($tel = trim($request->string('tel')->toString())) {
            $query->where('clients.phone', 'ilike', "%{$tel}%");
        }
        if ($adresse = trim($request->string('adresse')->toString())) {
            $query->where('clients.address', 'ilike', "%{$adresse}%");
        }
        if ($source = trim($request->string('source')->toString())) {
            $query->whereExists(function ($sub) use ($source) {
                $sub->selectRaw('1')
                    ->from('lead_sources')
                    ->whereColumn('lead_sources.id', 'clients.source_id')
                    ->where('lead_sources.name', 'ilike', "%{$source}%");
            });
        }

        $clients = $query->orderBy('clients.display_name')->get();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['q', 'status', 'type', 'nom', 'prenom', 'tel', 'adresse', 'source']),
        ]);
    }

    public function search(Request $request)
    {
        $q = trim($request->string('q')->toString());

        if (mb_strlen($q) < 1) {
            return response()->json(['results' => []]);
        }

        $normalize = static function (?string $value): string {
            $value = (string) $value;
            $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
            $value = $ascii !== false ? $ascii : $value;

            return trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower($value)) ?? '');
        };
        $normalizedQuery = $normalize($q);
        $digitsQuery = preg_replace('/\D+/', '', $q) ?? '';
        $candidates = Client::query()->get(['id', 'display_name', 'first_name', 'last_name', 'phone', 'email', 'address', 'identity_number', 'identity_document_type', 'identity_expiry_date', 'license_number', 'country_id']);
        $scored = $candidates->map(function (Client $client) use ($normalizedQuery, $digitsQuery, $normalize) {
            $name = $normalize($client->display_name);
            $firstName = $normalize($client->first_name);
            $lastName = $normalize($client->last_name);
            $variants = array_values(array_filter([
                $name,
                trim($firstName.' '.$lastName),
                trim($lastName.' '.$firstName),
                $firstName,
                $lastName,
            ]));
            $phone = preg_replace('/\D+/', '', (string) $client->phone) ?? '';
            $score = 0.0;
            $nameMatch = $normalizedQuery !== '' && collect($variants)->contains(
                fn (string $variant) => $variant !== '' && str_contains($variant, $normalizedQuery),
            );
            if ($nameMatch) {
                $score = 100 - (strlen($name) - strlen($normalizedQuery)) / 100;
            } elseif ($digitsQuery !== '' && $phone !== '' && str_contains($phone, $digitsQuery)) {
                $score = 95;
            } elseif ($normalizedQuery !== '' && $name !== '') {
                similar_text($normalizedQuery, $name, $percent);
                $score = $percent >= 45 ? $percent : 0;
            }

            return ['client' => $client, 'score' => $score];
        })->filter(fn (array $row) => $row['score'] > 0)->sortByDesc('score')->take(20);

        $ids = $scored->pluck('client.id')->all();
        $countryNames = DB::table('countries')->pluck('name', 'id');
        $lastRentals = DB::table('contracts')
            ->leftJoin('vehicles', 'vehicles.id', '=', 'contracts.vehicle_id')
            ->whereIn('contracts.client_id', $ids)
            ->orderByDesc('contracts.departure_at')
            ->get(['contracts.client_id', 'contracts.departure_at', 'contracts.return_at', 'vehicles.display_name as vehicle_name'])
            ->groupBy('client_id')
            ->map(fn ($rows) => $rows->first());

        return response()->json([
            'results' => $scored->values()->map(function (array $row) use ($lastRentals, $countryNames) {
                $client = $row['client'];
                $last = $lastRentals->get($client->id);

                return [
                    'id' => $client->id,
                    'display_name' => $client->display_name,
                    'first_name' => $client->first_name,
                    'last_name' => $client->last_name,
                    'phone' => $client->phone,
                    'address' => $client->address,
                    'email' => $client->email,
                    'identity_number' => $client->identity_number,
                    'identity_document_type' => $client->identity_document_type,
                    'identity_expiry_date' => $client->identity_expiry_date,
                    'license_number' => $client->license_number,
                    'country_id' => $client->country_id,
                    'country_name' => $countryNames[$client->country_id] ?? null,
                    'last_rental' => $last ? trim(($last->vehicle_name ?? 'Voiture').', '.substr((string) $last->departure_at, 0, 10)) : null,
                ];
            }),
        ]);
    }

    public function show(Client $client)
    {
        $client->load(['country', 'source', 'contracts.vehicle']);
        $totals = DB::table('contracts')->where('client_id', $client->id)
            ->selectRaw('count(*) as contracts, coalesce(sum(total_amount),0) as total')
            ->first();

        $contracts = $client->contracts;
        $contractIds = $contracts->pluck('id')->all();
        $contractsById = $contracts->keyBy('id');
        $rawPayments = DB::table('payments')
            ->whereIn('contract_id', $contractIds)
            ->orderBy('created_at')
            ->get();
        $paymentsByContract = $rawPayments->groupBy('contract_id');
        $invoiceRows = DB::table('invoices')
            ->where('client_id', $client->id)
            ->orderByDesc('issued_at')
            ->get(['id', 'reference', 'file_reference', 'issued_at', 'due_date', 'total', 'status']);

        $paymentHistory = $rawPayments->map(function ($payment) use ($contractsById, $paymentsByContract, $invoiceRows) {
            $contract = $contractsById->get($payment->contract_id);
            $group = $paymentsByContract->get($payment->contract_id, collect());
            $isFirst = $group->first()?->id === $payment->id;
            $isLast = $group->last()?->id === $payment->id;
            $contractTotal = (float) ($contract?->total_amount ?? 0);
            $paidOnContract = (float) $group->sum('amount');
            $status = match (true) {
                (float) $payment->amount < 0 => 'Remboursement',
                $payment->payment_status === 'annule' => 'Annulé',
                $contract && $isFirst && $group->count() > 1 => 'Avance reçue',
                $contract && $group->count() === 1 && $paidOnContract >= $contractTotal => 'Paiement complet',
                $contract && $isFirst && $paidOnContract >= $contractTotal => 'Paiement complet',
                $isLast && $contract && $paidOnContract >= $contractTotal => 'Paiement complet',
                default => 'Paiement partiel',
            };
            $invoiceReferences = $contract
                ? $invoiceRows->where('file_reference', $contract->reference)->pluck('reference')->all()
                : [];

            return [
                'id' => $payment->id,
                'date' => $payment->created_at,
                'amount' => (float) $payment->amount,
                'method' => $payment->payment_method,
                'status' => $status,
                'payment_status' => $payment->payment_status,
                'reference' => $payment->display_name,
                'contract_id' => $contract?->id,
                'contract_reference' => $contract?->reference,
                'contract_total' => $contractTotal,
                'contract_paid' => $paidOnContract,
                'contract_remaining' => max(0, $contractTotal - $paidOnContract),
                'invoice_references' => $invoiceReferences,
            ];
        })->values();

        $contractsTotal = (float) $contracts->sum('total_amount');
        $paidTotal = (float) $rawPayments->sum('amount');
        $remainingTotal = max(0, $contractsTotal - $paidTotal);
        $overpaid = max(0, $paidTotal - $contractsTotal);
        $advancesTotal = $paymentsByContract
            ->filter(fn ($group) => $group->count() > 1)
            ->sum(fn ($group) => (float) $group->first()->amount);

        $paymentSummary = [
            'contracts_total' => $contractsTotal,
            'paid_total' => $paidTotal,
            'remaining_total' => $remainingTotal,
            'overpaid' => $overpaid,
            'payments_count' => $rawPayments->count(),
            'advances_total' => (float) $advancesTotal,
            'invoices_total' => (float) $invoiceRows->sum('total'),
            'invoices_count' => $invoiceRows->count(),
            'invoices_unlinked' => $invoiceRows->filter(fn ($invoice) => blank($invoice->file_reference))->count(),
        ];

        $documents = Media::where('mediable_type', 'slv_locataires')
            ->where('mediable_id', $client->id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Clients/Show', [
            'client' => $client,
            'totals' => $totals,
            'documents' => $documents,
            'timeline' => app(TimelineService::class)->forClient($client->id),
            'paymentHistory' => $paymentHistory,
            'paymentSummary' => $paymentSummary,
            'clientInvoices' => $invoiceRows,
        ]);
    }

    public function create()
    {
        return Inertia::render('Clients/Form', [
            'client' => null,
            'countries' => Country::orderBy('name')->get(['id', 'name']),
            'sources' => LeadSource::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $this->validated($request);
        $data['created_by'] = $request->user()->id;
        $client = Client::create($data);
        $this->storeDocuments($request, $client);
        $audit->log('create', 'clients', $client->id, null, $client->toArray());

        return redirect()->route('clients.show', $client)->with('success', 'Client crÃ©Ã©.');
    }

    public function edit(Client $client)
    {
        $this->authorizeRecord($client, 'update');

        return Inertia::render('Clients/Form', [
            'client' => $client,
            'countries' => Country::orderBy('name')->get(['id', 'name']),
            'sources' => LeadSource::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Client $client, AuditService $audit)
    {
        $this->authorizeRecord($client, 'update');
        $data = $this->validated($request);
        $before = $client->toArray();
        $client->update($data);
        $this->storeDocuments($request, $client);
        $audit->log('update', 'clients', $client->id, $before, $client->fresh()->toArray());

        return redirect()->route('clients.show', $client)->with('success', 'Client mis Ã  jour.');
    }

    public function destroy(Client $client, AuditService $audit)
    {
        $this->authorizeRecord($client, 'delete');
        if ($client->contracts()->exists()) {
            return back()->with('error', 'Suppression refusÃ©e : des locations sont liÃ©es Ã  ce client.');
        }
        $audit->log('delete', 'clients', $client->id, $client->toArray());
        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client supprimÃ©.');
    }

    private function authorizeRecord(Client $client, string $action): void
    {
        abort_unless(
            auth()->user()?->canAccessRecord('slv_locataires', $action, $client),
            403,
            'Action non autorisÃ©e sur cet enregistrement.'
        );
    }

    private function storeDocuments(Request $request, Client $client): void
    {
        if (! $request->hasFile('identity_document')) {
            return;
        }
        foreach ($request->file('identity_document') as $file) {
            $path = $file->store('client-documents', 'local');
            $contents = (string) $file->get();
            app(FileStoreService::class)->put($path, $contents, $file->getClientMimeType());
            Media::create([
                'mediable_type' => 'slv_locataires',
                'mediable_id' => $client->id,
                'collection' => 'document_identite',
                'path' => $path,
                'sha256' => hash('sha256', $contents),
                'mime' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
            ]);
        }
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'client_type' => ['required', 'in:particulier,entreprise'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'birth_date' => ['nullable', 'date'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'source_id' => ['nullable', 'exists:lead_sources,id'],
            'status' => ['required', 'in:actif,blackliste,inactif,debiteur'],
            'identity_document_type' => ['nullable', 'in:cin,passport,carte_de_sejour,ice'],
            'identity_number' => ['nullable', 'string', 'max:255'],
            'identity_expiry_date' => ['nullable', 'date'],
            'identity_issued_at' => ['nullable', 'date'],
            'identity_country_id' => ['nullable', 'exists:countries,id'],
            'license_number' => ['nullable', 'string', 'max:255'],
            'color_hex' => ['nullable', 'string', 'max:7'],
        ]);
    }
}
