<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ArchiveService
{
    public const CUTOFF = '2024-01-01';

    private function definitions(): array
    {
        return [
            'contracts' => ['table' => 'contracts', 'date' => 'departure_at', 'exclude' => 'returned = true and coalesce((select remaining_calculated from v_contract_financials where id = contracts.id),0) <= 0'],
            'reservations' => ['table' => 'reservations', 'date' => 'departure_at', 'exclude' => "status in ('annulee','canceled')"],
            'payments' => ['table' => 'payments', 'date' => 'created_at', 'exclude' => '1 = 1'],
            'invoices' => ['table' => 'invoices', 'date' => 'issued_at', 'exclude' => '1 = 1'],
            'invoice_lines' => ['table' => 'invoice_lines', 'date' => 'created_at', 'exclude' => '1 = 1'],
            'quotes' => ['table' => 'quotes', 'date' => 'issued_at', 'exclude' => '1 = 1'],
            'maintenance_events' => ['table' => 'maintenance_events', 'date' => 'created_at', 'exclude' => '1 = 1'],
            'notifications' => ['table' => 'notifications', 'date' => 'created_at', 'exclude' => '1 = 1'],
        ];
    }

    public function dryRun(): array
    {
        $rows = [];
        foreach ($this->definitions() as $entity => $definition) {
            $query = DB::table($definition['table'])
                ->whereNotNull($definition['date'])
                ->where($definition['date'], '<', self::CUTOFF)
                ->whereRaw($definition['exclude']);
            $rows[] = [
                'entity' => $entity,
                'count' => (clone $query)->count(),
                'sum' => in_array($entity, ['contracts', 'payments', 'invoices', 'quotes'], true)
                    ? (float) (clone $query)->sum($entity === 'contracts' ? 'total_amount' : ($entity === 'payments' ? 'amount' : 'total'))
                    : 0.0,
            ];
        }
        return $rows;
    }

    public function apply(int $userId): array
    {
        $batch = 'archive-'.CarbonImmutable::now()->format('YmdHis').'-'.Str::lower(Str::random(6));
        $total = 0;
        DB::transaction(function () use ($batch, $userId, &$total) {
            foreach ($this->definitions() as $entity => $definition) {
                $records = DB::table($definition['table'])
                    ->whereNotNull($definition['date'])
                    ->where($definition['date'], '<', self::CUTOFF)
                    ->whereRaw($definition['exclude'])
                    ->select('id', $definition['date'].' as business_date')
                    ->get();
                foreach ($records->chunk(500) as $chunk) {
                    $inserts = $chunk->map(fn ($row) => [
                        'entity_type' => $entity, 'record_id' => $row->id, 'batch_id' => $batch,
                        'business_date' => substr((string) $row->business_date, 0, 10), 'archived_by' => $userId, 'created_at' => now(),
                    ])->all();
                    DB::table('archived_records')->insertOrIgnore($inserts);
                    $total += count($inserts);
                }
            }
        });
        return ['batch' => $batch, 'records' => $total];
    }

    public function restore(string $batch): int
    {
        return DB::table('archived_records')->where('batch_id', $batch)->delete();
    }

    public static function exclude($query, string $entity, string $column = 'id')
    {
        return $query->whereNotExists(function ($sub) use ($entity, $column) {
            $sub->selectRaw('1')
                ->from('archived_records')
                ->where('entity_type', $entity)
                ->whereColumn('record_id', $column);
        });
    }
}
