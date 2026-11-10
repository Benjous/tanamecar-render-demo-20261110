<?php

namespace App\Models;

use App\Models\Concerns\ExcludesArchived;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use ExcludesArchived;

    protected $table = 'payments';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'legacy_payload' => 'array',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }
}
