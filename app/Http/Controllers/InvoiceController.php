<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\InvoiceLine;
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

class InvoiceController extends Controller
{
    public function index(Request $request, SearchService $search)
    {
        $query = Invoice::query();

        $q = trim($request->string('q')->toString());
        if ($q !== '') {
            $query->where(function ($sub) use ($q, $search) {
                $search->apply($sub, [
                    'invoices.reference',
                    'invoices.file_reference',
                    'invoices.subject',
                    'invoices.total',
                    'invoices.issued_at',
                    'invoices.id',
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

        $totals = [
            'total' => (float) (clone $query)->sum('total'),
            'subtotal' => (float) (clone $query)->sum('subtotal'),
            'vat' => (float) (clone $query)->sum('vat_value'),
        ];

        return Inertia::render('Invoices/Index', [
            'invoices' => $query
                ->with('client:id,display_name')
                ->withSum('lines', 'net_price')
                ->withSum('lines', 'vat_value')
                ->select('id', 'reference', 'status', 'issued_at', 'total', 'file_reference', 'client_id')
                ->orderByDesc('issued_at')
                ->get(),
            'filters' => $request->only(['q', 'status', 'from', 'to']),
            'totals' => $totals,
        ]);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['client', 'lines']);
        $documents = Document::where('documentable_type', 'factures')->where('documentable_id', $invoice->id)->get();

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'documents' => $documents,
        ]);
    }

    public function create()
    {
        return Inertia::render('Invoices/Form', [
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

        $invoice = DB::transaction(function () use ($data, $subtotal, $vat, $total, $sequences, $request) {
            $invoice = Invoice::create([
                'reference' => $sequences->next('invoices'),
                'reference_format' => 'native_6',
                'reference_normalized' => '',
                'status' => 'confirmed',
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
                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
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

            return $invoice;
        });

        $audit->log('create', 'invoices', $invoice->id, null, $invoice->toArray());
        app(\App\Services\NotificationService::class)->notifyAdmins(
            'invoice.created',
            'Nouvelle facture',
            "{$invoice->reference} - ".number_format((float) $invoice->total, 2, ',', ' ').' MAD',
            ['invoice_id' => $invoice->id]
        );

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture créée.');
    }

    public function pdf(Invoice $invoice, PdfService $pdf)
    {
        $invoice->load(['client', 'lines']);
        $template = DB::table('invoice_templates')->whereNotNull('template_html')->where('template_html', '<>', '')->orderBy('id')->value('template_html');
        $output = $template && str_contains($template, '{{')
            ? $pdf->renderHtml($template, ['reference' => $invoice->reference, 'client' => $invoice->client?->display_name, 'issued_at' => $invoice->issued_at, 'total' => $invoice->total, 'subtotal' => $invoice->subtotal, 'vat' => $invoice->vat_value, 'company' => 'TanameCar'])
            : $pdf->render('pdf.invoice', ['invoice' => $invoice, 'company' => 'TanameCar']);
        $safeReference = str_replace(['/', '\\'], '-', $invoice->reference);
        $path = "generated/invoices/{$safeReference}.pdf";
        Storage::disk('local')->put($path, $output);
        app(FileStoreService::class)->put($path, $output, 'application/pdf');

        Document::create([
            'documentable_type' => 'factures',
            'documentable_id' => $invoice->id,
            'name' => "{$safeReference}.pdf",
            'path' => $path,
            'mime' => 'application/pdf',
            'size_bytes' => strlen($output),
        ]);

        return response()->download(storage_path("app/private/{$path}"), "{$safeReference}.pdf");
    }
}
