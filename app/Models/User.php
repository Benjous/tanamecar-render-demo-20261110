<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'organization_id', 'role_id', 'is_admin', 'active', 'confirmed_at', 'last_login_at', 'legacy_uid', 'legacy_payload'])]
#[Hidden(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'active' => 'boolean',
            'legacy_payload' => 'array',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    public function canDo(string $resource, string $action, string $scope = 'all'): bool
    {
        $value = $this->permissionScope($resource, $action);

        if ($value === 'no') {
            return false;
        }

        if ($action === 'read' || $action === 'update' || $action === 'delete' || $action === 'log') {
            return in_array($value, ['all', 'own', 'yes'], true);
        }

        return in_array($value, ['yes', 'all'], true);
    }

    public function permissionScope(string $resource, string $action): string
    {
        if ($this->isAdmin()) {
            return 'all';
        }

        $permissions = $this->role?->permissions ?? [];
        if (($permissions['*'] ?? null) === '*') {
            return 'all';
        }

        $key = "entity_{$resource}_{$action}";
        $value = $permissions[$key] ?? $permissions["settings_{$resource}_{$action}"] ?? 'no';

        if ($value === true) {
            return 'all';
        }
        if ($value === false || $value === null || $value === '') {
            return 'no';
        }

        return (string) $value;
    }

    public function canAccessRecord(string $resource, string $action, mixed $record): bool
    {
        $scope = $this->permissionScope($resource, $action);

        if (in_array($scope, ['all', 'yes'], true)) {
            return true;
        }

        if ($scope !== 'own' || ! $record) {
            return false;
        }

        $ownerId = is_array($record) ? ($record['created_by'] ?? null) : ($record->created_by ?? null);

        return $ownerId !== null && (int) $ownerId === (int) $this->id;
    }
}
