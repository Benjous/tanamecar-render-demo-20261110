<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ClientVolumeController extends Controller
{
    private const REFERENCE_KEY = 'client_reference_count';

    public function index()
    {
        $count = Client::query()->count();
        $reference = (int) (DB::table('settings')->where('key', self::REFERENCE_KEY)->value('value') ?? $count);
        $journal = DB::table('activity_log')
            ->leftJoin('users', 'users.id', '=', 'activity_log.user_id')
            ->where('activity_log.action', 'import_gap')
            ->orderByDesc('activity_log.created_at')
            ->limit(20)
            ->get(['activity_log.created_at', 'activity_log.after', 'users.name as user_name']);

        return Inertia::render('Settings/ClientVolume', [
            'count' => $count,
            'reference' => $reference,
            'gap' => $count - $reference,
            'journal' => $journal,
        ]);
    }

    public function updateReference(Request $request)
    {
        $data = $request->validate(['reference' => ['required', 'integer', 'min:0', 'max:10000000']]);
        DB::table('settings')->updateOrInsert(
            ['key' => self::REFERENCE_KEY],
            ['value' => json_encode($data['reference']), 'updated_at' => now()],
        );

        return back()->with('success', 'Nombre de référence mis à jour.');
    }

    public function simulate(Request $request)
    {
        return response()->json($this->analyse($request));
    }

    public function import(Request $request, AuditService $audit)
    {
        $analysis = $this->analyse($request);
        $created = 0;
        foreach ($analysis['rows'] as $row) {
            if ($row['status'] !== 'new') {
                continue;
            }
            $client = Client::create([
                'display_name' => $row['display_name'],
                'phone' => $row['phone'],
                'address' => $row['address'],
                'client_type' => 'particulier',
                'status' => 'actif',
                'created_by' => $request->user()->id,
            ]);
            $audit->log('create', 'clients', $client->id, null, $client->toArray());
            $created++;
        }
        $audit->log('import_gap', 'clients', null, null, [
            'submitted' => count($analysis['rows']),
            'created' => $created,
            'duplicates' => $analysis['duplicates'],
            'invalid' => $analysis['invalid'],
        ]);

        return back()->with('success', "Import terminé : {$created} client(s) créé(s), aucun doublon fusionné.");
    }

    private function analyse(Request $request): array
    {
        $payload = trim($request->string('payload')->toString());
        $rows = [];
        if (str_starts_with($payload, '[')) {
            $decoded = json_decode($payload, true);
            if (is_array($decoded)) {
                $rows = $decoded;
            }
        } else {
            foreach (preg_split('/\r?\n/', $payload) as $line) {
                $line = trim($line);
                if ($line === '') continue;
                $parts = array_map('trim', str_getcsv($line));
                $rows[] = ['name' => $parts[0] ?? '', 'phone' => $parts[1] ?? '', 'address' => $parts[2] ?? ''];
            }
        }

        $existingPhones = Client::query()->whereNotNull('phone')->pluck('phone')->map(fn ($phone) => preg_replace('/\D+/', '', (string) $phone))->filter()->flip();
        $existingNames = Client::query()->pluck('display_name')->map(fn ($name) => $this->normalize($name))->filter()->flip();
        $seenPhones = [];
        $seenNames = [];
        $analysed = [];
        $duplicates = 0;
        $invalid = 0;
        foreach ($rows as $row) {
            $name = trim((string) ($row['name'] ?? $row['display_name'] ?? ''));
            $phone = trim((string) ($row['phone'] ?? ''));
            $address = trim((string) ($row['address'] ?? ''));
            if ($name === '') {
                $invalid++;
                $analysed[] = ['display_name' => '', 'phone' => $phone, 'address' => $address, 'status' => 'invalid', 'reason' => 'Nom manquant'];
                continue;
            }
            $phoneKey = preg_replace('/\D+/', '', $phone) ?? '';
            $nameKey = $this->normalize($name);
            $duplicate = ($phoneKey !== '' && ($existingPhones->has($phoneKey) || isset($seenPhones[$phoneKey])))
                || $existingNames->has($nameKey) || isset($seenNames[$nameKey]);
            if ($duplicate) {
                $duplicates++;
                $analysed[] = ['display_name' => $name, 'phone' => $phone, 'address' => $address, 'status' => 'duplicate', 'reason' => 'Téléphone ou nom déjà présent'];
            } else {
                $seenPhones[$phoneKey] = true;
                $seenNames[$nameKey] = true;
                $analysed[] = ['display_name' => $name, 'phone' => $phone, 'address' => $address, 'status' => 'new', 'reason' => 'Nouveau'];
            }
        }

        return ['rows' => $analysed, 'duplicates' => $duplicates, 'invalid' => $invalid, 'new' => count($analysed) - $duplicates - $invalid];
    }

    private function normalize(?string $value): string
    {
        $value = (string) $value;
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        return trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower($ascii !== false ? $ascii : $value)) ?? '');
    }
}
