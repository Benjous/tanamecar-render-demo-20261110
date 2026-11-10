<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditHouse extends Model
{
    protected $table = 'credit_houses';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'legacy_payload' => 'array',
        ];
    }


}
