<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutolocTraiteSummary extends Model
{
    protected $table = 'autoloc_traite_summaries';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'monthly_amount_recorded' => 'decimal:6',
            'total_amount_recorded' => 'decimal:8',
            'paid_amount_recorded' => 'decimal:8',
            'remaining_amount_recorded' => 'decimal:8',
            'raw_record' => 'array',
            'modified_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }
}
