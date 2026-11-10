<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceLine extends Model
{
    protected $table = 'invoice_lines';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'unit_price' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'quantity' => 'decimal:2',
        'net_price' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'vat_value' => 'decimal:2',
        'price' => 'decimal:2',
        'warehouses' => 'array',
        'legacy_payload' => 'array',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
