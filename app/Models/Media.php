<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Media extends Model
{
    protected $table = 'media';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'legacy_payload' => 'array',
        'created_at' => 'datetime',
        ];
    }


}

