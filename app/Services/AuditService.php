<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class AuditService
{
    public function log(string $action, ?string $entityType = null, ?int $entityId = null, ?array $before = null, ?array $after = null): void
    {
        DB::table('activity_log')->insert([
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'before' => $before ? json_encode($before) : null,
            'after' => $after ? json_encode($after) : null,
            'ip' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
            'created_at' => now(),
        ]);
    }
}
