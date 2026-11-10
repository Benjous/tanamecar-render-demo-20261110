<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExportAudit extends Command
{
    protected $signature = 'audit:export
        {--from= : Date de début (Y-m-d)}
        {--to= : Date de fin (Y-m-d)}
        {--user= : Identifiant utilisateur}
        {--action= : Action à filtrer}
        {--format=csv : csv ou json}
        {--output= : Fichier de sortie}';

    protected $description = 'Exporte le journal d’audit interne (accès développeur, hors interface client).';

    public function handle(): int
    {
        $query = DB::table('activity_log')
            ->leftJoin('users', 'users.id', '=', 'activity_log.user_id')
            ->select('activity_log.*', 'users.name as user_name')
            ->orderBy('activity_log.created_at');

        if ($from = $this->option('from')) {
            $query->where('activity_log.created_at', '>=', $from.' 00:00:00');
        }
        if ($to = $this->option('to')) {
            $query->where('activity_log.created_at', '<=', $to.' 23:59:59');
        }
        if ($user = $this->option('user')) {
            $query->where('activity_log.user_id', $user);
        }
        if ($action = $this->option('action')) {
            $query->where('activity_log.action', $action);
        }

        $rows = $query->get();
        $format = strtolower((string) $this->option('format'));
        $output = $this->option('output');

        if ($format === 'json') {
            $content = $rows->toJson(JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } else {
            $handle = fopen('php://temp', 'r+');
            fputcsv($handle, ['id', 'created_at', 'user_id', 'user_name', 'action', 'entity_type', 'entity_id', 'ip', 'user_agent'], ';');
            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->id,
                    $row->created_at,
                    $row->user_id,
                    $row->user_name,
                    $row->action,
                    $row->entity_type,
                    $row->entity_id,
                    $row->ip,
                    $row->user_agent,
                ], ';');
            }
            rewind($handle);
            $content = stream_get_contents($handle);
            fclose($handle);
        }

        if ($output) {
            file_put_contents($output, $content);
            $this->info("Audit exporté vers {$output} ({$rows->count()} lignes).");
        } else {
            $this->line($content);
        }

        return self::SUCCESS;
    }
}
