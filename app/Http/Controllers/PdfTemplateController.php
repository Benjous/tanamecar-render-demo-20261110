<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PdfTemplateController extends Controller
{
    private const TYPES = [
        'contract' => ['table' => 'contract_templates', 'label' => 'Contrat'],
        'invoice' => ['table' => 'invoice_templates', 'label' => 'Facture'],
        'quote' => ['table' => 'quote_templates', 'label' => 'Devis'],
    ];

    public function index(Request $request)
    {
        $type = array_key_exists($request->string('type')->toString(), self::TYPES) ? $request->string('type')->toString() : 'contract';
        $config = self::TYPES[$type];
        $templates = DB::table($config['table'])->orderBy('id')->get(['id', 'name', 'template_html', 'page_size', 'page_orientation']);

        return Inertia::render('Settings/PdfTemplates', [
            'type' => $type,
            'types' => collect(self::TYPES)->map(fn ($row, $key) => ['value' => $key, 'label' => $row['label']])->values(),
            'templates' => $templates,
        ]);
    }

    public function update(Request $request, string $type, int $id, AuditService $audit)
    {
        abort_unless(isset(self::TYPES[$type]), 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'template_html' => ['nullable', 'string'],
            'page_size' => ['nullable', 'in:A3,A4,A5,receipt-thermal'],
            'page_orientation' => ['nullable', 'in:portrait,landscape'],
        ]);
        $table = self::TYPES[$type]['table'];
        $before = DB::table($table)->where('id', $id)->first();
        abort_unless($before, 404);
        DB::table($table)->where('id', $id)->update($data + ['updated_at' => now()]);
        $audit->log('update', $table, $id, (array) $before, $data);

        return back()->with('success', 'Modèle enregistré.');
    }
}
