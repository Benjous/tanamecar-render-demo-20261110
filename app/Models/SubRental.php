<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubRental extends Model
{
    protected $table = 'sub_rentals';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'days_recorded' => 'decimal:2', 'rate_recorded' => 'decimal:6', 'total_recorded' => 'decimal:8',
            'price_recorded' => 'decimal:8', 'profit_recorded' => 'decimal:8', 'advance_recorded' => 'decimal:8', 'credit_recorded' => 'decimal:8',
            'days_current' => 'decimal:2', 'rate_current' => 'decimal:6', 'total_current' => 'decimal:8',
            'price_current' => 'decimal:8', 'profit_current' => 'decimal:8', 'advance_current' => 'decimal:8', 'credit_current' => 'decimal:8',
            'raw_record' => 'array', 'modified_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo { return $this->belongsTo(Vehicle::class); }
    public function modifiedBy(): BelongsTo { return $this->belongsTo(User::class, 'modified_by'); }
}
