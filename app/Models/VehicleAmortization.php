<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleAmortization extends Model
{
    protected $table = 'vehicle_amortizations';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'revenue_recorded' => 'decimal:8',
            'credit_recorded' => 'decimal:8',
            'balance_recorded' => 'decimal:8',
            'objective_recorded' => 'decimal:8',
            'price_per_km_recorded' => 'decimal:8',
            'price_recorded' => 'decimal:8',
            'real_cost_recorded' => 'decimal:8',
            'remaining_recorded' => 'decimal:8',
            'net_remaining_recorded' => 'decimal:8',
            'balance_current' => 'decimal:8',
            'revenue_current' => 'decimal:8',
            'credit_current' => 'decimal:8',
            'objective_current' => 'decimal:8',
            'price_per_km_current' => 'decimal:8',
            'price_current' => 'decimal:8',
            'real_cost_current' => 'decimal:8',
            'remaining_current' => 'decimal:8',
            'net_remaining_current' => 'decimal:8',
            'raw_record' => 'array',
            'modified_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }
}
