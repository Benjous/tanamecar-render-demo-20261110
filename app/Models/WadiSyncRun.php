<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WadiSyncRun extends Model
{
    protected $guarded = [];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'snapshot_at' => 'datetime',
        'summary' => 'array',
        'errors' => 'array',
    ];
}
