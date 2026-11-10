<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutolocDriverCandidate extends Model
{
    protected $table = 'autoloc_driver_candidates';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['raw_record' => 'array', 'modified_at' => 'datetime'];
    }
}
