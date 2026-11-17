<?php

namespace App\Services;

use App\Models\WadiRecord;
use App\Models\WadiSyncRun;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class WadiSyncService
{
    /**
     * @return array{found: bool, changed: bool, applied: bool, conflict: bool}
     */
    public function run(?string $snapshotPath = null, bool $apply = false, string $mode = 'apply', ?int $runId = null): WadiSyncRun
    {
        $run = $runId ? WadiSyncRun::find($runId) : null;
        $run ??= new WadiSyncRun;
        $run->fill([
            'status' => 'running',
            'mode' => $mode,
            'started_at' => now(),
            'finished_at' => null,
            'snapshot_path' => $snapshotPath,
            'snapshot_at' => null,
            'entities_total' => 0,
            'records_fetched' => 0,
            'created_count' => 0,
            'updated_count' => 0,
            'unchanged_count' => 0,
            'conflict_count' => 0,
            'pending_count' => 0,
            'error_count' => 0,
            'summary' => [],
            'errors' => [],
            'message' => null,
        ])->save();

        try {
            if (! $snapshotPath) {
                $snapshotPath = $this->fetchSnapshot();
                $run->snapshot_path = $snapshotPath;
            }

            if (! is_file($snapshotPath)) {
                throw new \RuntimeException('Instantané WADI introuvable.');
            }

            $snapshot = json_decode(file_get_contents($snapshotPath), true, flags: JSON_THROW_ON_ERROR);
            if (! is_array($snapshot) || ! ($snapshot['ok'] ?? false)) {
                $message = is_array($snapshot) ? ($snapshot['error'] ?? 'Instantané WADI incomplet.') : 'Instantané WADI illisible.';
                throw new \RuntimeException($message);
            }

            $run->snapshot_at = isset($snapshot['fetched_at']) ? Carbon::parse($snapshot['fetched_at']) : null;
            $this->applySnapshot($run, $snapshot, $apply);

            $run->status = $run->error_count > 0 ? 'partial' : 'success';
            $run->message = $run->status === 'success'
                ? 'Synchronisation terminée.'
                : 'Synchronisation terminée avec des anomalies.';
        } catch (Throwable $exception) {
            $run->status = 'failed';
            $run->message = mb_substr($exception->getMessage(), 0, 1000);
            $run->errors = array_merge($run->errors ?? [], [[
                'scope' => 'run',
                'error' => mb_substr($exception->getMessage(), 0, 1000),
            ]]);
            $run->error_count = count($run->errors);
        }

        $run->finished_at = now();
        $run->save();

        return $run;
    }

    private function fetchSnapshot(): string
    {
        $url = (string) config('wadi.fetch_url');
        if ($url === '') {
            throw new \RuntimeException('Service local de récupération WADI non configuré.');
        }

        $response = Http::withHeaders(array_filter([
            'x-wadi-token' => config('wadi.fetch_token'),
        ]))->timeout(300)->post($url);

        $result = $response->json();
        if (! $response->successful() || ! is_array($result) || ! ($result['ok'] ?? false) || empty($result['snapshot'])) {
            $detail = is_array($result) ? ($result['error'] ?? 'réponse invalide') : 'réponse invalide';

            throw new \RuntimeException('Récupération WADI interrompue : '.mb_substr((string) $detail, 0, 800));
        }

        return (string) $result['snapshot'];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    private function applySnapshot(WadiSyncRun $run, array $snapshot, bool $apply): void
    {
        $summary = [];
        $errors = [];
        $totals = [
            'records_fetched' => 0,
            'created_count' => 0,
            'updated_count' => 0,
            'unchanged_count' => 0,
            'conflict_count' => 0,
            'pending_count' => 0,
            'business_applied' => 0,
            'business_created' => 0,
        ];

        foreach (($snapshot['errors'] ?? []) as $fetchError) {
            $errors[] = [
                'scope' => 'fetch',
                'entity' => $fetchError['entity'] ?? null,
                'error' => mb_substr((string) ($fetchError['error'] ?? 'Erreur de récupération.'), 0, 1000),
            ];
        }

        $entities = $snapshot['entities'] ?? [];
        $priority = ['slv_locataires' => 1, 'slv_vehicules' => 2, 'slv_contrats' => 3, 'slv_paiements' => 4];
        usort($entities, fn (array $left, array $right): int => ($priority[$left['name'] ?? ''] ?? 50) <=> ($priority[$right['name'] ?? ''] ?? 50));

        foreach ($entities as $entity) {
            $name = (string) ($entity['name'] ?? '');
            if ($name === '') {
                continue;
            }

            $stats = [
                'label' => (string) ($entity['label'] ?? $name),
                'fetched' => 0,
                'raw_created' => 0,
                'raw_updated' => 0,
                'raw_unchanged' => 0,
                'business_applied' => 0,
                'business_created' => 0,
                'pending' => 0,
                'conflicts' => 0,
                'errors' => 0,
            ];

            foreach (($entity['items'] ?? []) as $item) {
                if (! is_array($item)) {
                    continue;
                }

                $wadiId = (string) ($item['id'] ?? $item['uid'] ?? '');
                if ($wadiId === '') {
                    $stats['errors']++;
                    $errors[] = [
                        'scope' => 'item',
                        'entity' => $name,
                        'error' => 'Identifiant WADI absent.',
                    ];

                    continue;
                }

                $stats['fetched']++;
                $totals['records_fetched']++;
                $payload = json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $hash = hash('sha256', $payload ?: '');
                $reference = $this->reference($item);

                $record = WadiRecord::query()
                    ->where('entity', $name)
                    ->where('wadi_id', $wadiId)
                    ->first();

                if (! $record) {
                    WadiRecord::create([
                        'entity' => $name,
                        'wadi_id' => $wadiId,
                        'reference' => $reference,
                        'content_hash' => $hash,
                        'payload' => $item,
                        'first_seen_at' => now(),
                        'last_seen_at' => now(),
                        'last_changed_at' => now(),
                    ]);
                    $stats['raw_created']++;
                    $totals['created_count']++;
                } elseif ($record->content_hash !== $hash) {
                    $record->update([
                        'reference' => $reference,
                        'content_hash' => $hash,
                        'payload' => $item,
                        'last_seen_at' => now(),
                        'last_changed_at' => now(),
                    ]);
                    $stats['raw_updated']++;
                    $totals['updated_count']++;
                } else {
                    $record->forceFill(['last_seen_at' => now()])->saveQuietly();
                    $stats['raw_unchanged']++;
                    $totals['unchanged_count']++;
                }

                $business = $this->applyBusinessRecord($name, $item, $apply);
                if ($business['pending']) {
                    $stats['pending']++;
                    $totals['pending_count']++;
                }
                if ($business['conflict']) {
                    $stats['conflicts']++;
                    $totals['conflict_count']++;
                }
                if ($business['applied']) {
                    $stats['business_applied']++;
                    $totals['business_applied']++;
                }
                if ($business['created']) {
                    $stats['business_created']++;
                    $totals['business_created']++;
                }
                if ($business['error']) {
                    $stats['errors']++;
                    $errors[] = [
                        'scope' => 'business',
                        'entity' => $name,
                        'wadi_id' => $wadiId,
                        'error' => mb_substr($business['error'], 0, 1000),
                    ];
                }
            }

            $summary[$name] = $stats;
        }

        $run->entities_total = count($summary);
        if ($apply && $totals['business_created'] > 0) {
            $this->advanceSequence();
        }
        $run->records_fetched = $totals['records_fetched'];
        $run->created_count = $totals['created_count'];
        $run->updated_count = $totals['updated_count'];
        $run->unchanged_count = $totals['unchanged_count'];
        $run->conflict_count = $totals['conflict_count'];
        $run->pending_count = $totals['pending_count'];
        $run->summary = [
            'entities' => $summary,
            'business_applied' => $totals['business_applied'],
            'business_created' => $totals['business_created'],
            'dry_run' => ! $apply,
        ];

        $run->errors = array_slice($errors, 0, 100);
        $run->error_count = count($errors);
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array{pending: bool, conflict: bool, applied: bool, created: bool, error: ?string}
     */
    private function applyBusinessRecord(string $entity, array $item, bool $apply): array
    {
        $result = ['pending' => false, 'conflict' => false, 'applied' => false, 'created' => false, 'error' => null];

        try {
            $record = match ($entity) {
                'slv_contrats' => $this->contractRecord($item),
                'slv_locataires' => DB::table('clients')->where('id', (int) ($item['id'] ?? 0))->first(),
                'slv_vehicules' => DB::table('vehicles')->where('id', (int) ($item['id'] ?? 0))->first(),
                'slv_paiements' => DB::table('payments')->where('id', (int) ($item['id'] ?? 0))->first(),
                'factures' => $this->invoiceRecord($item),
                'slv_maintenance' => DB::table('maintenance_events')->where('id', (int) ($item['id'] ?? 0))->first(),
                default => null,
            };

            if (! $record) {
                if (! in_array($entity, ['slv_contrats', 'slv_locataires', 'slv_vehicules', 'slv_paiements', 'factures', 'slv_maintenance'], true)) {
                    return $result;
                }

                if ($apply && (bool) config('wadi.create_missing')) {
                    $createdId = match ($entity) {
                        'slv_locataires' => $this->createClient($item),
                        'slv_vehicules' => $this->createVehicle($item),
                        'slv_contrats' => $this->createContract($item),
                        default => null,
                    };

                    if ($createdId !== null) {
                        $result['created'] = true;

                        return $result;
                    }
                }

                $result['pending'] = true;

                return $result;
            }

            $updates = match ($entity) {
                'slv_contrats' => $this->contractUpdates($item),
                'slv_locataires' => $this->clientUpdates($item),
                'slv_vehicules' => $this->vehicleUpdates($item),
                'slv_paiements' => $this->paymentUpdates($item),
                default => [],
            };

            $updates = array_filter(
                $updates,
                fn (mixed $value, string $key): bool => ! $this->sameValue($record->{$key} ?? null, $value),
                ARRAY_FILTER_USE_BOTH,
            );

            if ($updates === []) {
                return $result;
            }

            if (! $this->wadiIsNewer($item, $record->updated_at ?? null)) {
                $result['conflict'] = true;

                return $result;
            }

            if (! $apply) {
                $result['applied'] = false;

                return $result;
            }

            $table = match ($entity) {
                'slv_contrats' => 'contracts',
                'slv_locataires' => 'clients',
                'slv_vehicules' => 'vehicles',
                'slv_paiements' => 'payments',
            };

            $updates['updated_at'] = now();
            DB::table($table)->where('id', $record->id)->update($updates);
            $result['applied'] = true;
        } catch (Throwable $exception) {
            $result['error'] = $exception->getMessage();
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function invoiceRecord(array $item): ?object
    {
        $reference = $this->reference($item);
        if ($reference !== null) {
            $record = DB::table('invoices')->where('reference', $reference)->first();
            if ($record) {
                return $record;
            }
        }

        return DB::table('invoices')->where('id', (int) ($item['id'] ?? 0))->first();
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function createClient(array $item): ?int
    {
        $id = (int) ($item['id'] ?? 0);
        if ($id <= 0 || DB::table('clients')->where('id', $id)->exists()) {
            return null;
        }

        $createdAt = $this->date($this->value($item, 'created_at')) ?? now();
        $updatedAt = $this->date($this->value($item, 'updated_at')) ?? $createdAt;
        $name = trim((string) $this->value($item, 'name'));

        DB::table('clients')->insert([
            'id' => $id,
            'legacy_uid' => is_numeric($item['uid'] ?? null) ? (int) $item['uid'] : null,
            'legacy_payload' => json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'display_name' => $name !== '' ? $name : null,
            'first_name' => $this->value($item, 'prenom') ?: null,
            'last_name' => $this->value($item, 'nom') ?: null,
            'phone' => $this->value($item, 'primary_phone') ?: $this->value($item, 'telephone') ?: null,
            'email' => $this->value($item, 'primary_email') ?: $this->value($item, 'email') ?: null,
            'address' => $this->value($item, 'adresse') ?: null,
            'identity_number' => $this->value($item, 'n_identite') ?: null,
            'license_number' => $this->value($item, 'n_permis') ?: null,
            'birth_date' => $this->date($this->value($item, 'date_de_naissance'))?->toDateString(),
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ]);

        return $id;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function createVehicle(array $item): ?int
    {
        $id = (int) ($item['id'] ?? 0);
        if ($id <= 0 || DB::table('vehicles')->where('id', $id)->exists()) {
            return null;
        }

        $plate = trim((string) $this->value($item, 'matricule'));
        if ($plate !== '' && DB::table('vehicles')->where('plate_number', $plate)->exists()) {
            return (int) DB::table('vehicles')->where('plate_number', $plate)->value('id');
        }

        $createdAt = $this->date($this->value($item, 'created_at')) ?? now();
        $updatedAt = $this->date($this->value($item, 'updated_at')) ?? $createdAt;

        DB::table('vehicles')->insert([
            'id' => $id,
            'legacy_uid' => is_numeric($item['uid'] ?? null) ? (int) $item['uid'] : null,
            'legacy_payload' => json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'display_name' => $this->value($item, 'name') ?: null,
            'plate_number' => $plate !== '' ? $plate : null,
            'km' => is_numeric($this->value($item, 'km')) ? $this->value($item, 'km') + 0 : null,
            'gearbox' => $this->value($item, 'boite_de_vitesse') ?: null,
            'fuel_type' => $this->value($item, 'carburant') ?: null,
            'chassis_number' => $this->value($item, 'n_de_chassis') ?: null,
            'fiscal_power' => is_numeric($this->value($item, 'puissance_fiscale')) ? $this->value($item, 'puissance_fiscale') + 0 : null,
            'first_registration_date' => $this->date($this->value($item, 'date_de_mise_en_circulation'))?->toDateString(),
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ]);

        return $id;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function createContract(array $item): ?int
    {
        $id = (int) ($item['id'] ?? 0);
        $reference = trim((string) ($this->value($item, 'reference') ?: $this->value($item, 'name')));
        if ($id <= 0 || $reference === '') {
            return null;
        }

        if (DB::table('contracts')->where('id', $id)->orWhere('reference', $reference)->exists()) {
            return null;
        }

        $clientId = $this->relationValue($item, 'locataire');
        $vehicleId = $this->relationValue($item, 'voiture');
        if ($clientId <= 0 || $vehicleId <= 0
            || ! DB::table('clients')->where('id', $clientId)->exists()
            || ! DB::table('vehicles')->where('id', $vehicleId)->exists()) {
            return null;
        }

        $createdAt = $this->date($this->value($item, 'created_at')) ?? now();
        $updatedAt = $this->date($this->value($item, 'updated_at')) ?? $createdAt;
        $firstDriverId = $this->relationValue($item, '1er_locataire');
        $secondDriverId = $this->relationValue($item, '2eme_locataire');

        DB::table('contracts')->insert([
            'id' => $id,
            'legacy_uid' => is_numeric($item['uid'] ?? null) ? (int) $item['uid'] : null,
            'legacy_payload' => json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'reference' => $reference,
            'display_name' => $reference,
            'departure_at' => $this->date($this->value($item, 'date_depart')),
            'return_at' => $this->date($this->value($item, 'date_retour')),
            'departure_km' => is_numeric($this->value($item, 'km_depart')) ? $this->value($item, 'km_depart') + 0 : null,
            'return_km' => is_numeric($this->value($item, 'km_retour')) ? $this->value($item, 'km_retour') + 0 : null,
            'departure_place' => $this->value($item, 'lieu_depart') ?: null,
            'return_place' => $this->value($item, 'lieu_retour') ?: null,
            'client_id' => $clientId,
            'vehicle_id' => $vehicleId,
            'first_driver_id' => $firstDriverId > 0 && DB::table('clients')->where('id', $firstDriverId)->exists() ? $firstDriverId : null,
            'second_driver_id' => $secondDriverId > 0 && DB::table('clients')->where('id', $secondDriverId)->exists() ? $secondDriverId : null,
            'client_is_main_driver' => in_array((string) $this->value($item, 'conducteur_principal'), ['1', 'true'], true),
            'days' => is_numeric($this->value($item, 'nombre_jours')) ? $this->value($item, 'nombre_jours') + 0 : null,
            'daily_rate' => is_numeric($this->value($item, 'prix_jour')) ? $this->value($item, 'prix_jour') + 0 : null,
            'total_amount' => is_numeric($this->value($item, 'prix_total')) ? $this->value($item, 'prix_total') + 0 : null,
            'paid_amount_recorded' => is_numeric($this->value($item, 'paye')) ? $this->value($item, 'paye') + 0 : null,
            'remaining_recorded' => is_numeric($this->value($item, 'reste')) ? $this->value($item, 'reste') + 0 : null,
            'deposit' => is_numeric($this->value($item, 'caution')) ? $this->value($item, 'caution') + 0 : null,
            'deductible' => is_numeric($this->value($item, 'franchise')) ? $this->value($item, 'franchise') + 0 : null,
            'returned' => in_array((string) $this->value($item, 'receptionne'), ['1', 'true'], true),
            'note' => $this->value($item, 'note') ?: null,
            'reference_normalized' => $reference,
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ]);

        return $id;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function contractRecord(array $item): ?object
    {
        $reference = $this->reference($item);
        if ($reference !== null) {
            $record = DB::table('contracts')->where('reference', $reference)->first();
            if ($record) {
                return $record;
            }
        }

        return DB::table('contracts')->where('id', (int) ($item['id'] ?? 0))->first();
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function contractUpdates(array $item): array
    {
        $updates = [];
        $departure = $this->date($this->value($item, 'date_depart'));
        if ($departure) {
            $updates['departure_at'] = $departure;
        }

        $return = $this->date($this->value($item, 'date_retour'));
        if ($return) {
            $updates['return_at'] = $return;
        }

        $this->putNumber($updates, 'departure_km', $this->value($item, 'km_depart'));
        $this->putNumber($updates, 'return_km', $this->value($item, 'km_retour'));
        $this->putNumber($updates, 'days', $this->value($item, 'nombre_jours'));

        foreach (['lieu_depart' => 'departure_place', 'lieu_retour' => 'return_place', 'note' => 'note'] as $source => $target) {
            $value = $this->value($item, $source);
            if (is_string($value) && $value !== '') {
                $updates[$target] = $value;
            }
        }

        $returned = $this->value($item, 'receptionne');
        if ($returned !== null && $returned !== '') {
            $updates['returned'] = in_array((string) $returned, ['1', 'true'], true);
        }

        $clientId = $this->relationValue($item, 'locataire');
        if ($clientId > 0 && DB::table('clients')->where('id', $clientId)->exists()) {
            $updates['client_id'] = $clientId;
        }

        $vehicleId = $this->relationValue($item, 'voiture');
        if ($vehicleId > 0 && DB::table('vehicles')->where('id', $vehicleId)->exists()) {
            $updates['vehicle_id'] = $vehicleId;
        }

        return $updates;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function clientUpdates(array $item): array
    {
        $updates = [];
        $this->putString($updates, 'display_name', $this->value($item, 'name'));
        $this->putString($updates, 'phone', $this->value($item, 'primary_phone') ?: $this->value($item, 'telephone'));
        $this->putString($updates, 'email', $this->value($item, 'primary_email') ?: $this->value($item, 'email'));
        $this->putString($updates, 'address', $this->value($item, 'adresse'));
        $this->putString($updates, 'identity_number', $this->value($item, 'n_identite'));
        $this->putString($updates, 'license_number', $this->value($item, 'n_permis'));

        $birthDate = $this->date($this->value($item, 'date_de_naissance'));
        if ($birthDate) {
            $updates['birth_date'] = $birthDate;
        }

        return $updates;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function vehicleUpdates(array $item): array
    {
        $updates = [];
        $this->putString($updates, 'display_name', $this->value($item, 'name'));
        $this->putString($updates, 'plate_number', $this->value($item, 'matricule'));
        $this->putString($updates, 'gearbox', $this->value($item, 'boite_de_vitesse'));
        $this->putString($updates, 'fuel_type', $this->value($item, 'carburant'));
        $this->putString($updates, 'chassis_number', $this->value($item, 'n_de_chassis'));
        $this->putNumber($updates, 'km', $this->value($item, 'km'));
        $this->putNumber($updates, 'fiscal_power', $this->value($item, 'puissance_fiscale'));

        $registration = $this->date($this->value($item, 'date_de_mise_en_circulation'));
        if ($registration) {
            $updates['first_registration_date'] = $registration;
        }

        return $updates;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function paymentUpdates(array $item): array
    {
        $updates = [];
        $this->putString($updates, 'payment_method', $this->value($item, 'mode_de_paiement'));
        $this->putNumber($updates, 'amount', $this->value($item, 'montant'));
        $this->putNumber($updates, 'remaining_amount', $this->value($item, 'reste'));
        $this->putString($updates, 'payment_status', $this->value($item, 'statut_de_paiement'));

        $contractId = $this->relationValue($item, 'contrat');
        if ($contractId > 0 && DB::table('contracts')->where('id', $contractId)->exists()) {
            $updates['contract_id'] = $contractId;
        }

        return $updates;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function relationValue(array $item, string $key): int
    {
        $relation = $item[$key] ?? null;
        if (is_array($relation)) {
            return (int) ($relation['value'] ?? 0);
        }

        return is_scalar($relation) ? (int) $relation : 0;
    }

    private function advanceSequence(): void
    {
        DB::statement("SELECT setval('global_id_seq', GREATEST(
            (SELECT last_value FROM global_id_seq),
            (SELECT COALESCE(MAX(id), 1) FROM clients),
            (SELECT COALESCE(MAX(id), 1) FROM vehicles),
            (SELECT COALESCE(MAX(id), 1) FROM contracts),
            (SELECT COALESCE(MAX(id), 1) FROM payments)
        ))");

        $maxContractReference = DB::table('contracts')
            ->pluck('reference')
            ->map(fn (mixed $reference): int => (int) preg_replace('/\D/', '', (string) $reference))
            ->max();

        DB::table('sequences')
            ->where('name', 'contracts')
            ->update(['next_value' => max(1, $maxContractReference + 1)]);
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function wadiIsNewer(array $item, mixed $localUpdatedAt): bool
    {
        $wadiUpdated = $this->date($this->value($item, 'updated_at'));
        if (! $wadiUpdated || ! $localUpdatedAt) {
            return false;
        }

        return $wadiUpdated->greaterThan(Carbon::parse($localUpdatedAt));
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function reference(array $item): ?string
    {
        foreach (['reference', 'name', 'id'] as $key) {
            $value = $item[$key] ?? null;
            if (is_scalar($value) && (string) $value !== '') {
                return mb_substr((string) $value, 0, 255);
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function value(array $item, string $key): mixed
    {
        $value = $item[$key] ?? null;
        if (is_array($value) && array_key_exists('value', $value)) {
            return $value['value'];
        }

        return $value;
    }

    private function date(mixed $value): ?Carbon
    {
        if (is_array($value)) {
            $value = $value['value'] ?? null;
        }
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            $date = Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }

        return $date->year >= 1950 && $date->year <= 2100 ? $date : null;
    }

    /**
     * @param  array<string, mixed>  $updates
     */
    private function putString(array &$updates, string $key, mixed $value): void
    {
        if (is_scalar($value) && trim((string) $value) !== '') {
            $updates[$key] = trim((string) $value);
        }
    }

    /**
     * @param  array<string, mixed>  $updates
     */
    private function putNumber(array &$updates, string $key, mixed $value): void
    {
        if (is_numeric($value)) {
            $updates[$key] = $value + 0;
        }
    }

    private function sameValue(mixed $current, mixed $next): bool
    {
        if ($next instanceof Carbon) {
            if (! $current) {
                return false;
            }

            return Carbon::parse($current)->equalTo($next);
        }

        if (is_bool($next)) {
            return (bool) $current === $next;
        }

        if (is_numeric($next)) {
            return is_numeric($current) && abs((float) $current - (float) $next) < 0.00001;
        }

        return trim((string) ($current ?? '')) === trim((string) ($next ?? ''));
    }
}
