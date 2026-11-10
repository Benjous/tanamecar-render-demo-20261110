<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ImportController extends Controller
{
    private const ENTITIES = [
        'clients' => [
            'label' => 'Clients',
            'columns' => ['display_name', 'client_type', 'status', 'phone', 'email', 'address', 'identity_number'],
            'required' => ['display_name'],
        ],
        'vehicles' => [
            'label' => 'Voitures',
            'columns' => ['display_name', 'plate_number', 'status', 'operating_mode', 'km', 'daily_rate'],
            'required' => ['display_name'],
        ],
    ];

    public function index()
    {
        return Inertia::render('Settings/Import', [
            'entities' => collect(self::ENTITIES)->map(fn ($config, $key) => [
                'key' => $key,
                'label' => $config['label'],
                'columns' => $config['columns'],
            ])->values(),
            'preview' => null,
        ]);
    }

    public function preview(Request $request)
    {
        $data = $request->validate([
            'entity' => ['required', 'in:clients,vehicles'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $token = Str::random(40);
        $path = $request->file('file')->storeAs('imports', $token.'.csv', 'local');
        $parsed = $this->parse($path, $data['entity']);

        return Inertia::render('Settings/Import', [
            'entities' => collect(self::ENTITIES)->map(fn ($config, $key) => [
                'key' => $key,
                'label' => $config['label'],
                'columns' => $config['columns'],
            ])->values(),
            'preview' => [
                'entity' => $data['entity'],
                'token' => $token,
                'headers' => $parsed['headers'],
                'rows' => $parsed['rows'],
                'stats' => $parsed['stats'],
                'global_errors' => $parsed['global_errors'],
            ],
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'entity' => ['required', 'in:clients,vehicles'],
            'token' => ['required', 'string', 'regex:/^[A-Za-z0-9]+$/'],
        ]);

        $path = 'imports/'.$data['token'].'.csv';
        abort_unless(Storage::disk('local')->exists($path), 404, 'Fichier d’import introuvable.');

        $parsed = $this->parse($path, $data['entity']);
        if ($parsed['global_errors']) {
            return back()->with('error', implode(' ', $parsed['global_errors']));
        }

        $batchId = DB::table('import_batches')->insertGetId([
            'name' => 'Import '.$data['entity'].' '.now()->format('d/m/Y H:i'),
            'source_file' => $path,
            'imported_at' => now(),
            'imported_by' => auth()->id(),
            'record_count' => 0,
            'notes' => 'Import CSV avec contrôle, simulation et déduplication.',
        ]);

        $imported = 0;
        $skipped = 0;

        foreach ($parsed['rows'] as $row) {
            if ($row['status'] !== 'ok') {
                $skipped++;
                continue;
            }

            $values = $row['values'];
            $values['created_by'] = auth()->id();
            $values['created_at'] = now();
            $values['updated_at'] = now();
            $values['data_quality_status'] = 'imported';
            $values['import_batch_id'] = $batchId;
            $values['legacy_payload'] = json_encode(['source' => 'csv_import', 'row' => $row['raw']]);

            if ($data['entity'] === 'clients') {
                $values['client_type'] = $values['client_type'] ?? 'particulier';
                $values['status'] = $values['status'] ?? 'actif';
                DB::table('clients')->insert($values);
            } else {
                $values['status'] = $values['status'] ?? 'disponible';
                $values['operating_mode'] = $values['operating_mode'] ?? 'location';
                DB::table('vehicles')->insert($values);
            }
            $imported++;
        }

        DB::table('import_batches')->where('id', $batchId)->update(['record_count' => $imported]);
        $audit->log('import', $data['entity'], $batchId, null, [
            'imported' => $imported,
            'skipped' => $skipped,
            'file' => $path,
        ]);

        return redirect()->route('settings.import')->with(
            'success',
            "Import terminé : {$imported} enregistrement(s) importé(s), {$skipped} ignoré(s) (doublon ou erreur)."
        );
    }

    private function parse(string $path, string $entity): array
    {
        $config = self::ENTITIES[$entity];
        $fullPath = Storage::disk('local')->path($path);
        $handle = fopen($fullPath, 'r');
        $firstLine = fgets($handle) ?: '';
        rewind($handle);
        $delimiter = substr_count($firstLine, ';') >= substr_count($firstLine, ',') ? ';' : ',';

        $headers = fgetcsv($handle, 0, $delimiter) ?: [];
        $headers = array_map(function ($header) {
            $header = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header);
            return Str::snake(trim($header));
        }, $headers);

        $globalErrors = [];
        foreach ($config['required'] as $required) {
            if (! in_array($required, $headers, true)) {
                $globalErrors[] = "Colonne obligatoire manquante : {$required}.";
            }
        }

        $rows = [];
        $seen = [];
        $stats = ['total' => 0, 'ok' => 0, 'duplicate' => 0, 'error' => 0];

        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($line === [null] || count(array_filter($line, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $stats['total']++;
            $raw = [];
            foreach ($headers as $index => $header) {
                if (in_array($header, $config['columns'], true)) {
                    $raw[$header] = trim((string) ($line[$index] ?? ''));
                }
            }

            $errors = [];
            foreach ($config['required'] as $required) {
                if (($raw[$required] ?? '') === '') {
                    $errors[] = "Champ obligatoire vide : {$required}.";
                }
            }

            $key = $this->dedupeKey($entity, $raw);
            if ($key !== '' && isset($seen[$key])) {
                $errors[] = 'Doublon dans le fichier.';
            }
            if ($key !== '') {
                $seen[$key] = true;
            }

            if (! $errors && $this->existsInDatabase($entity, $raw)) {
                $errors[] = 'Doublon avec un enregistrement existant.';
            }

            $status = $errors ? (str_contains(implode(' ', $errors), 'Doublon') ? 'duplicate' : 'error') : 'ok';
            $stats[$status]++;

            $rows[] = [
                'raw' => $raw,
                'values' => $raw,
                'status' => $status,
                'errors' => $errors,
            ];

            if (count($rows) >= 5000) {
                break;
            }
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $rows,
            'stats' => $stats,
            'global_errors' => $globalErrors,
        ];
    }

    private function dedupeKey(string $entity, array $row): string
    {
        if ($entity === 'clients') {
            return Str::lower(trim(($row['phone'] ?? '').'|'.($row['email'] ?? '').'|'.($row['display_name'] ?? '')));
        }

        return Str::upper(preg_replace('/[^A-Z0-9]/i', '', $row['plate_number'] ?? ''));
    }

    private function existsInDatabase(string $entity, array $row): bool
    {
        if ($entity === 'clients') {
            return DB::table('clients')
                ->where(function ($query) use ($row) {
                    if (! empty($row['phone'])) {
                        $query->orWhere('phone', $row['phone']);
                    }
                    if (! empty($row['email'])) {
                        $query->orWhere('email', $row['email']);
                    }
                    if (! empty($row['display_name'])) {
                        $query->orWhere('display_name', $row['display_name']);
                    }
                })
                ->exists();
        }

        if (empty($row['plate_number'])) {
            return false;
        }

        return DB::table('vehicles')->where('plate_number', $row['plate_number'])->exists();
    }
}
