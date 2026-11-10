<?php

namespace App\Models;

use App\Models\Concerns\ExcludesArchived;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use ExcludesArchived;

    protected $table = 'vehicles';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'first_registration_date' => 'date',
        'credit_due_date' => 'date',
        'km' => 'decimal:2',
        'fiscal_power' => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'credit_down_payment' => 'decimal:2',
        'monthly_installment' => 'decimal:2',
        'daily_rate' => 'decimal:2',
        'credit_months' => 'decimal:2',
        'legacy_payload' => 'array',
        ];
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'disponible');
    }

    public function scopeInRepair(Builder $query): Builder
    {
        return $query->where('status', 'en_reparation');
    }

    public function scopeSousLocation(Builder $query): Builder
    {
        return $query->where('operating_mode', 'sous_location');
    }

    public function scopeLocationMode(Builder $query): Builder
    {
        return $query->where('operating_mode', 'location');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function model(): BelongsTo
    {
        return $this->belongsTo(VehicleModel::class, 'model_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class, 'color_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(VehicleCategory::class, 'category_id');
    }

    public function lessor(): BelongsTo
    {
        return $this->belongsTo(Lessor::class, 'lessor_id');
    }

    public function creditHouse(): BelongsTo
    {
        return $this->belongsTo(CreditHouse::class, 'credit_house_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'vehicle_id');
    }
}
