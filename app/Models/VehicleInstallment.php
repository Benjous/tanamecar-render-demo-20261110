<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleInstallment extends Model
{
    protected $table = 'vehicle_installments';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount_recorded' => 'decimal:6',
            'amount_current' => 'decimal:6',
            'due_date' => 'date',
            'date_recorded' => 'date',
            'raw_record' => 'array',
            'modified_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function summary(): BelongsTo
    {
        return $this->belongsTo(AutolocTraiteSummary::class, 'summary_id');
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
