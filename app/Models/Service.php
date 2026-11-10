<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $table = 'services';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'purchase_price' => 'decimal:2',
        'price' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'min_stock' => 'decimal:2',
        'vat_included' => 'boolean',
        'manage_stock' => 'boolean',
        'favorite' => 'boolean',
        'active' => 'boolean',
        'legacy_payload' => 'array',
        ];
    }


}
