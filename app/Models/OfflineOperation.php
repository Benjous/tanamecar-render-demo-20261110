<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfflineOperation extends Model
{
    protected $guarded = [];

    protected $casts = [
        'payload' => 'array',
        'response_headers' => 'array',
        'server_data' => 'array',
    ];
}
