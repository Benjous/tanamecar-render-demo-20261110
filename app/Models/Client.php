<?php

namespace App\Models;

use App\Models\Concerns\ExcludesArchived;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use ExcludesArchived;

    protected $table = 'clients';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'birth_date' => 'date',
        'identity_expiry_date' => 'date',
        'identity_issued_at' => 'date',
        'legacy_payload' => 'array',
        ];
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function identityCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'identity_country_id');
    }

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'source_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class, 'client_id');
    }
}
