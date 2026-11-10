<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $table = 'roles';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
        'permissions' => 'array',
        'by_default' => 'boolean',
        'legacy_payload' => 'array',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
