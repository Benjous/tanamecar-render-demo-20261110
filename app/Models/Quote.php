<?php

namespace App\Models;

use App\Models\Concerns\ExcludesArchived;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    use ExcludesArchived;

    protected $table = 'quotes';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'issued_at' => 'date',
        'due_at' => 'date',
        'cancelled_at' => 'datetime',
        'validated' => 'boolean',
        'discount_value' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'subtotal_before_discount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'vat_value' => 'decimal:2',
        'total_before_discount' => 'decimal:2',
        'total' => 'decimal:2',
        'legacy_payload' => 'array',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(QuoteLine::class, 'quote_id');
    }
}
