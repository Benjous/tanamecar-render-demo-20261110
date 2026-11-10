<?php

return [
    'binary' => env('DB_DUMP_BINARY', 'pg_dump'),
    'directory' => storage_path('app/backups'),
    'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),
];
