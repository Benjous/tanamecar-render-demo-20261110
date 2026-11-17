<?php

namespace App\Console\Commands;

use App\Models\WadiSyncRun;
use App\Services\WadiSyncService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SyncWadi extends Command
{
    protected $signature = 'wadi:sync
        {--snapshot= : Instantané WADI déjà téléchargé}
        {--dry-run : Détecte les écarts sans modifier les données métier}
        {--run-id= : Suivi existant créé depuis l’interface}';

    protected $description = 'Synchronise les données WADI DEV vers TANAME, en lecture seule sur WADI';

    public function handle(WadiSyncService $service): int
    {
        $runId = $this->option('run-id') ? (int) $this->option('run-id') : null;
        $dryRun = (bool) $this->option('dry-run');
        $apply = ! $dryRun && (bool) config('wadi.apply');
        $mode = $dryRun || ! $apply ? 'dry-run' : 'apply';

        $lockPath = storage_path('framework/wadi-sync.lock');
        File::ensureDirectoryExists(dirname($lockPath));
        $lock = fopen($lockPath, 'c');
        if ($lock === false || ! flock($lock, LOCK_EX | LOCK_NB)) {
            $message = 'Une autre synchronisation WADI est déjà en cours.';
            if ($runId) {
                WadiSyncRun::query()->whereKey($runId)->update([
                    'status' => 'failed',
                    'finished_at' => now(),
                    'message' => $message,
                ]);
            }
            $this->error($message);

            return self::FAILURE;
        }

        try {
            $run = $service->run(
                $this->option('snapshot') ? (string) $this->option('snapshot') : null,
                $apply,
                $mode,
                $runId,
            );
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }

        if ($run->status === 'failed') {
            $this->error($run->message ?? 'Synchronisation WADI échouée.');

            return self::FAILURE;
        }

        $this->info(json_encode([
            'status' => $run->status,
            'mode' => $run->mode,
            'records' => $run->records_fetched,
            'created' => $run->created_count,
            'updated' => $run->updated_count,
            'business_created' => $run->summary['business_created'] ?? 0,
            'pending' => $run->pending_count,
            'conflicts' => $run->conflict_count,
            'errors' => $run->error_count,
        ], JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }
}
