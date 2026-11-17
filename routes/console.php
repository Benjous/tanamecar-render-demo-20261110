<?php

use App\Services\ArchiveService;
use App\Services\AutolocTraiteImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('archive:2022-2023 {--apply}', function (ArchiveService $service) {
    $rows = $service->dryRun();
    $this->line(json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($this->option('apply')) {
        $result = $service->apply((int) (DB::table('users')->where('is_admin', true)->value('id') ?? 0));
        $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
})->purpose('Simule ou applique l archivage réversible des transactions 2022 2023');

Artisan::command('autoloc:traites-import {file} {target} {--dry-run}', function (AutolocTraiteImportService $importer) {
    $target = (string) $this->argument('target');
    $database = match ($target) {
        'prep' => 'tanamecar_prep_autoloc',
        'live' => 'tanamecar_live',
        default => null,
    };
    if (! $database) {
        $this->error('Cible refusée. Valeurs autorisées : prep, live.');

        return 2;
    }

    $file = (string) $this->argument('file');
    if (! is_file($file)) {
        $this->error('Fichier JSON introuvable.');

        return 2;
    }
    $dataset = json_decode(file_get_contents($file), true, flags: JSON_THROW_ON_ERROR);
    $preview = $importer->preview($dataset);
    if ($this->option('dry-run')) {
        $this->line(json_encode(['target' => $target, 'database' => $database, 'dry_run' => true] + $preview, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return 0;
    }

    if ($target === 'live') {
        Config::set('database.connections.pgsql.database', 'tanamecar_prep_autoloc');
        Config::set('database.connections.pgsql.username', env('DB_PREP_USERNAME', 'postgres'));
        Config::set('database.connections.pgsql.password', env('DB_PREP_PASSWORD', ''));
        DB::purge('pgsql');
        $dataset = $importer->exportFromStaging('pgsql');
        $stagingPreview = $importer->preview($dataset);
        if ($stagingPreview !== $preview) {
            throw new RuntimeException('Import live arrêté : les volumes ou la somme de préparation ne correspondent pas au dry run.');
        }
    }

    Config::set('database.connections.pgsql.database', $database);
    Config::set('database.connections.pgsql.username', env('DB_USERNAME', 'postgres'));
    Config::set('database.connections.pgsql.password', env('DB_PASSWORD', ''));
    DB::purge('pgsql');
    $result = $importer->import($dataset, 'pgsql');
    if ($result['summaries_inserted'] !== $preview['summaries']
        || $result['installments_inserted'] !== $preview['installments']
        || abs($result['recorded_amount_sum'] - $preview['recorded_amount_sum']) >= 0.005) {
        throw new RuntimeException('Contrôle post-import en échec. La transaction a été annulée.');
    }
    $this->line(json_encode(['target' => $target, 'database' => $database, 'source' => $target === 'live' ? 'tanamecar_prep_autoloc' : 'json dry run', 'dry_run' => false] + $result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return 0;
})->purpose('Simule ou importe les traites Autoloc uniquement dans les bases de préparation ou live');

Schedule::command('wadi:sync')
    ->everyFifteenMinutes()
    ->withoutOverlapping(25)
    ->when(fn (): bool => (bool) config('wadi.enabled'));
