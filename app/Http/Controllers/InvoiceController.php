<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Payment;
use App\Models\Service;
use App\Services\AuditService;
use App\Services\FileStoreService;
use App\Services\NotificationService;
use App\Services\PdfService;
use App\Services\SearchService;
use App\Services\SequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
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
        if ($numero = trim($request->string('numero')->toString())) {
            if (ctype_digit($numero)) {
                $query->where('invoices.id', (int) $numero);
            }
        }
        if ($reference = trim($request->string('reference')->toString())) {
            $query->where('invoices.reference', 'ilike', "%{$reference}%");
        }
        if ($dossier = trim($request->string('dossier')->toString())) {
            $query->where('invoices.file_reference', 'ilike', "%{$dossier}%");
        }
        if ($nom = trim($request->string('nom')->toString())) {
            $query->whereHas('client', fn ($client) => $client->where('last_name', 'ilike', "%{$nom}%"));
        }
        if ($prenom = trim($request->string('prenom')->toString())) {
            $query->whereHas('client', fn ($client) => $client->where('first_name', 'ilike', "%{$prenom}%"));
        }
        if ($date = $request->date('date')) {
            $query->whereDate('issued_at', $date->toDateString());
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
                ->select('id', 'reference', 'status', 'issued_at', 'due_date', 'total', 'file_reference', 'subject', 'client_id')
                ->orderByDesc('issued_at')
                ->get(),
            'filters' => $request->only(['q', 'status', 'from', 'to', 'numero', 'reference', 'dossier', 'nom', 'prenom', 'date']),
            'totals' => $totals,
        ]);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['client', 'lines']);
        $documents = Document::where('documentable_type', 'factures')->where('documentable_id', $invoice->id)->get();
        $contract = $invoice->file_reference
            ? Contract::query()->where('reference', $invoice->file_reference)->first()
            : null;
        $payments = $contract
            ? Payment::query()->where('contract_id', $contract->id)->orderBy('created_at')->get()
            : collect();
        $paid = $contract ? (float) $payments->sum('amount') : null;
        $balance = $paid !== null ? max(0, (float) $invoice->total - $paid) : null;

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'documents' => $documents,
            'contract' => $contract,
            'payments' => $payments,
            'paid' => $paid,
            'balance' => $balance,
        ]);
    }

    public function create()
    {
        return Inertia::render('Invoices/Form', [
            'clients' => Client::orderBy('display_name')->get(['id', 'display_name', 'phone', 'address', 'identity_number']),
            'services' => Service::orderBy('name')->get(['id', 'name', 'price', 'vat_rate']),
        ]);
    }

    public function edit(Invoice $invoice)
    {
        $invoice->load(['client', 'lines']);

        return Inertia::render('Invoices/Form', [
            'invoice' => $invoice,
            'clients' => Client::orderBy('display_name')->get(['id', 'display_name', 'phone', 'address', 'identity_number']),
            'services' => Service::orderBy('name')->get(['id', 'name', 'price', 'vat_rate']),
        ]);
    }

    public function update(Request $request, Invoice $invoice, AuditService $audit)
    {
        $data = $request->validate([
            'reference' => ['required', 'string', 'max:255', Rule::unique('invoices', 'reference')->ignore($invoice->id)],
            'status' => ['required', 'in:confirmed,paid,cancelled,draft'],
            'client_id' => ['required', 'exists:clients,id'],
            'issued_at' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'subject' => ['nullable', 'string', 'max:255'],
            'file_reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.designation' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.vat_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $subtotalBefore = 0.0;
        $vatBefore = 0.0;
        $lineRows = [];
        foreach ($data['lines'] as $index => $line) {
            $net = round((float) $line['quantity'] * (float) $line['unit_price'], 2);
            $lineVat = round($net * (float) $line['vat_rate'] / 100, 2);
            $subtotalBefore += $net;
            $vatBefore += $lineVat;
            $lineRows[] = [
                'invoice_id' => $invoice->id,
                'designation' => $line['designation'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'net_price' => $net,
                'vat_rate' => $line['vat_rate'],
                'vat_value' => $lineVat,
                'price' => round($net + $lineVat, 2),
                'display_order' => $index + 1,
            ];
        }

        $subtotalBefore = round($subtotalBefore, 2);
        $vatBefore = round($vatBefore, 2);
        $discountValue = round((float) ($data['discount_value'] ?? 0), 2);
        $discountPercent = round((float) ($data['discount_percent'] ?? 0), 2);
        $discountTotal = min($subtotalBefore, round($discountValue + ($subtotalBefore * $discountPercent / 100), 2));
        $ratio = $subtotalBefore > 0 ? ($subtotalBefore - $discountTotal) / $subtotalBefore : 0;
        $subtotal = round($subtotalBefore - $discountTotal, 2);
        $vat = round($vatBefore * $ratio, 2);
        $total = round($subtotal + $vat, 2);
        $before = $invoice->toArray();
        $oldReference = $invoice->reference;

        DB::transaction(function () use ($invoice, $data, $lineRows, $subtotalBefore, $vatBefore, $discountValue, $discountPercent, $subtotal, $vat, $total) {
            $invoice->update([
                'reference' => $data['reference'],
                'reference_normalized' => strtoupper(preg_replace('/[^A-Z0-9]/i', '', $data['reference'])),
                'status' => $data['status'],
                'client_id' => $data['client_id'],
                'issued_at' => $data['issued_at'],
                'due_date' => $data['due_date'] ?? null,
                'subject' => $data['subject'] ?? null,
                'file_reference' => $data['file_reference'] ?? null,
                'note' => $data['note'] ?? null,
                'discount_value' => $discountValue,
                'discount_percent' => $discountPercent,
                'subtotal_before_discount' => $subtotalBefore,
                'subtotal' => $subtotal,
                'vat_value' => $vat,
                'total_before_discount' => round($subtotalBefore + $vatBefore, 2),
                'total' => $total,
            ]);
            $invoice->lines()->delete();
            InvoiceLine::insert($lineRows);
        });

        foreach ([$oldReference, $data['reference']] as $reference) {
            $safe = str_replace(['/', '\\'], '-', $reference);
            Storage::disk('local')->delete([
                "generated/invoices/{$safe}-avec-entete.pdf",
                "generated/invoices/{$safe}-sans-entete.pdf",
            ]);
        }
        Document::where('documentable_type', 'factures')->where('documentable_id', $invoice->id)->delete();

        $audit->log('update', 'invoices', $invoice->id, $before, $invoice->fresh('lines')->toArray());

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture modifiée.');
    }

    public function store(Request $request, SequenceService $sequences, AuditService $audit)
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'issued_at' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after:issued_at'],
            'subject' => ['nullable', 'string', 'max:255'],
            'file_reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.designation' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.vat_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $subtotalBefore = 0.0;
        $vatBefore = 0.0;
        foreach ($data['lines'] as $line) {
            $net = round($line['quantity'] * $line['unit_price'], 2);
            $subtotalBefore += $net;
            $vatBefore += round($net * $line['vat_rate'] / 100, 2);
        }
        $subtotalBefore = round($subtotalBefore, 2);
        $vatBefore = round($vatBefore, 2);
        $discountValue = round((float) ($data['discount_value'] ?? 0), 2);
        $discountPercent = round((float) ($data['discount_percent'] ?? 0), 2);
        $discountTotal = min($subtotalBefore, round($discountValue + ($subtotalBefore * $discountPercent / 100), 2));
        $ratio = $subtotalBefore > 0 ? ($subtotalBefore - $discountTotal) / $subtotalBefore : 0;
        $subtotal = round($subtotalBefore - $discountTotal, 2);
        $vat = round($vatBefore * $ratio, 2);
        $total = round($subtotal + $vat, 2);
        $reference = $sequences->next('invoices');

        $invoice = DB::transaction(function () use ($data, $subtotalBefore, $vatBefore, $subtotal, $vat, $total, $reference, $request, $discountValue, $discountPercent) {
            $invoice = Invoice::create([
                'reference' => $reference,
                'reference_format' => 'native_6',
                'reference_normalized' => strtoupper(preg_replace('/[^A-Z0-9]/i', '', $reference)),
                'status' => 'confirmed',
                'issued_at' => $data['issued_at'],
                'due_date' => $data['due_date'],
                'subject' => $data['subject'] ?? null,
                'file_reference' => $data['file_reference'] ?? null,
                'client_id' => $data['client_id'],
                'discount_value' => $discountValue,
                'discount_percent' => $discountPercent,
                'subtotal_before_discount' => $subtotalBefore,
                'subtotal' => $subtotal,
                'vat_value' => $vat,
                'total_before_discount' => round($subtotalBefore + $vatBefore, 2),
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
        app(NotificationService::class)->notifyAdmins(
            'invoice.created',
            'Nouvelle facture',
            "{$invoice->reference} - ".number_format((float) $invoice->total, 2, ',', ' ').' MAD',
            ['invoice_id' => $invoice->id]
        );

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture créée.');
    }

    public function pdf(Invoice $invoice, PdfService $pdf)
    {
        return $this->renderInvoicePdf($invoice, $pdf, true);
    }

    public function pdfHeader(Invoice $invoice, PdfService $pdf)
    {
        return $this->renderInvoicePdf($invoice, $pdf, true);
    }

    public function pdfNoHeader(Invoice $invoice, PdfService $pdf)
    {
        return $this->renderInvoicePdf($invoice, $pdf, false);
    }

    public function printHeader(Invoice $invoice, PdfService $pdf)
    {
        return $this->renderInvoicePdf($invoice, $pdf, true, 'inline');
    }

    public function printNoHeader(Invoice $invoice, PdfService $pdf)
    {
        return $this->renderInvoicePdf($invoice, $pdf, false, 'inline');
    }

    private function renderInvoicePdf(Invoice $invoice, PdfService $pdf, bool $withHeader, string $disposition = 'attachment')
    {
        $safeReference = str_replace(['/', '\\'], '-', $invoice->reference);
        $suffix = $withHeader ? 'avec-entete' : 'sans-entete';
        $filename = "{$safeReference}-{$suffix}.pdf";
        $path = "generated/invoices/{$filename}";

        if (! Storage::disk('local')->exists($path)) {
            $invoice->load(['client', 'lines']);
            $output = $pdf->render('pdf.invoice-document', [
                'invoice' => $invoice,
                'withBranding' => $withHeader,
            ], 'A4', false);
            Storage::disk('local')->put($path, $output);
            app(FileStoreService::class)->put($path, $output, 'application/pdf');

            Document::updateOrCreate(
                [
                    'documentable_type' => 'factures',
                    'documentable_id' => $invoice->id,
                    'name' => $filename,
                ],
                [
                    'path' => $path,
                    'mime' => 'application/pdf',
                    'size_bytes' => strlen($output),
                ],
            );
        }

        return response()->download(
            storage_path("app/private/{$path}"),
            $filename,
            ['Content-Type' => 'application/pdf'],
            $disposition,
        );
    }
}
