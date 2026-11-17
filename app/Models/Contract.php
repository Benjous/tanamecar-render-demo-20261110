<?php

namespace App\Models;

use App\Models\Concerns\ExcludesArchived;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use ExcludesArchived;

    protected $table = 'contracts';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'departure_at' => 'datetime',
            'return_at' => 'datetime',
            'returned' => 'boolean',
            'client_is_main_driver' => 'boolean',
            'daily_rate' => 'decimal:2',
            'days' => 'decimal:2',
            'discount_per_day' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'vat_applicable' => 'boolean',
            'total_amount' => 'decimal:2',
            'paid_amount_recorded' => 'decimal:2',
            'remaining_recorded' => 'decimal:2',
            'deductible' => 'decimal:2',
            'deposit' => 'decimal:2',
            'legacy_payload' => 'array',
        ];
    }

    public const OPERATIONS_TIMEZONE = 'Africa/Casablanca';

    public function scopeDueBucket(Builder $query, string $bucket): Builder
    {
        $today = CarbonImmutable::now(self::OPERATIONS_TIMEZONE)->startOfDay();
        $start = match ($bucket) {
            'today' => $today,
            'tomorrow' => $today->addDay(),
            'after_tomorrow' => $today->addDays(2),
            'month' => $today->startOfMonth(),
            default => null,
        };

        if (! $start) {
            return $query->whereRaw('1 = 0');
        }

        return $query
            ->where('returned', false)
            ->whereNotNull('return_at')
            ->where('return_at', '>=', $start->utc())
            ->where('return_at', '<', ($bucket === 'month' ? $start->addMonth() : $start->addDay())->utc());
    }

    public function scopeOverdue(Builder $query): Builder
    {
        $today = CarbonImmutable::now(self::OPERATIONS_TIMEZONE)->startOfDay();

        return $query
            ->where('returned', false)
            ->whereNotNull('return_at')
            ->where('return_at', '<', $today->utc());
    }

    public function scopeInRental(Builder $query): Builder
    {
        return $query->where('returned', false);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function firstDriver(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'first_driver_id');
    }

    public function secondDriver(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'second_driver_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'contract_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'documentable_id')
            ->where('documentable_type', 'slv_contrats');
    }
}
