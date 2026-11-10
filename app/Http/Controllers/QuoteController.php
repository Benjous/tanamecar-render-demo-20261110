<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Quote;
use App\Models\QuoteLine;
use App\Models\Service;
use App\Services\AuditService;
use App\Services\FileStoreService;
use App\Services\PdfService;
use App\Services\SearchService;
use App\Services\SequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuoteController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = Quote::query();

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($q, $search) {
                $search->apply($sub, [
                    'quotes.reference',
                    'quotes.subject',
                    'quotes.total',
                    'quotes.issued_at',
                    'quotes.id',
                ], $q);
                $sub->orWhereHas('client', fn ($client) => $search->apply($client, ['display_name', 'phone', 'email'], $q));
            });
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }
        if ($from = $request->date('from')) {
            $query->where('issued_at', '>=', $from->startOfDay());
        }
        if ($to = $request->date('to')) {
            $query->where('issued_at', '<=', $to->endOfDay());
        }

        return Inertia::render('Quotes/Index', [
            'quotes' => $query
                ->with('client:id,display_name')
                ->withSum('lines', 'net_price')
                ->withSum('lines', 'vat_value')
                ->select('id', 'reference', 'status', 'issued_at', 'total', 'client_id')
                ->orderByDesc('created_at')
                ->get(),
            'filters' => $request->only(['q', 'status', 'from', 'to']),
        ]);
    }

    public function show(Quote $quote)
    {
        $quote->load(['client', 'lines']);
        return Inertia::render('Quotes/Show', ['quote' => $quote]);
    }

    public function create()
    {
        return Inertia::render('Quotes/Form', [
            'clients' => Client::orderBy('display_name')->get(['id', 'display_name']),
            'services' => Service::orderBy('name')->get(['id', 'name', 'price', 'vat_rate']),
        ]);
    }

    public function store(Request $request, SequenceService $sequences, AuditService $audit)
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'issued_at' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'subject' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.designation' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.vat_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $subtotal = 0;
        $vat = 0;
        foreach ($data['lines'] as $line) {
            $net = round($line['quantity'] * $line['unit_price'], 2);
            $subtotal += $net;
            $vat += round($net * $line['vat_rate'] / 100, 2);
        }
        $total = round($subtotal + $vat, 2);

        $quote = DB::transaction(function () use ($data, $subtotal, $vat, $total, $sequences, $request) {
            $quote = Quote::create([
                'reference' => $sequences->next('quotes'),
                'reference_format' => 'native_6',
                'reference_normalized' => '',
                'status' => 'draft',
                'issued_at' => $data['issued_at'],
                'due_date' => $data['due_date'] ?? null,
                'subject' => $data['subject'] ?? null,
                'client_id' => $data['client_id'],
                'subtotal_before_discount' => $subtotal,
                'subtotal' => $subtotal,
                'vat_value' => $vat,
                'total_before_discount' => $total,
                'total' => $total,
                'note' => $data['note'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['lines'] as $i => $line) {
                $net = round($line['quantity'] * $line['unit_price'], 2);
                QuoteLine::create([
                    'quote_id' => $quote->id,
                    'designation' => $line['designation'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'net_price' => $net,
                    'vat_rate' => $line['vat_rate'],
                    'vat_value' => round($net * $line['vat_rate'] / 100, 2),
                    'price' => round($net * (1 + $line['vat_rate'] / 100), 2),
                    'display_order' => $i + 1,
                ]);
            }

            return $quote;
        });

        $audit->log('create', 'quotes', $quote->id, null, $quote->toArray());

        return redirect()->route('quotes.show', $quote)->with('success', 'Devis créé.');
    }

    public function pdf(Quote $quote, PdfService $pdf)
    {
        $quote->load(['client', 'lines']);
        $template = DB::table('quote_templates')->whereNotNull('template_html')->where('template_html', '<>', '')->orderBy('id')->value('template_html');
        $output = $template && str_contains($template, '{{')
            ? $pdf->renderHtml($template, ['reference' => $quote->reference, 'client' => $quote->client?->display_name, 'issued_at' => $quote->issued_at, 'total' => $quote->total, 'subtotal' => $quote->subtotal, 'vat' => $quote->vat_value, 'company' => 'TanameCar'])
            : $pdf->render('pdf.quote', ['quote' => $quote, 'company' => 'TanameCar']);
        $safeReference = str_replace(['/', '\\'], '-', $quote->reference);
        $path = "generated/quotes/{$safeReference}.pdf";
        Storage::disk('local')->put($path, $output);
        app(FileStoreService::class)->put($path, $output, 'application/pdf');

        return response()->download(storage_path("app/private/{$path}"), "{$safeReference}.pdf");
    }
}
