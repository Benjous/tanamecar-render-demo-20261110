<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WadiRecord extends Model
{
    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'last_changed_at' => 'datetime',
    ];
}
