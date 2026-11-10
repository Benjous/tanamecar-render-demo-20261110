<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $resources = ['charges', 'agenda', 'client_credits', 'profit_entries', 'incidents'];
        $roles = DB::table('roles')->where('name', 'Gestion de contrat')->get();
        foreach ($roles as $role) {
            $permissions = json_decode($role->permissions ?? '{}', true) ?: [];
            foreach ($resources as $resource) {
                $permissions["entity_{$resource}_view"] = 'yes';
                $permissions["entity_{$resource}_read"] = 'all';
                $permissions["entity_{$resource}_create"] = 'yes';
                $permissions["entity_{$resource}_update"] = 'own';
                $permissions["entity_{$resource}_delete"] = 'own';
                $permissions["entity_{$resource}_log"] = 'own';
            }
            DB::table('roles')->where('id', $role->id)->update([
                'permissions' => json_encode($permissions),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        $resources = ['charges', 'agenda', 'client_credits', 'profit_entries', 'incidents'];
        $roles = DB::table('roles')->where('name', 'Gestion de contrat')->get();
        foreach ($roles as $role) {
            $permissions = json_decode($role->permissions ?? '{}', true) ?: [];
            foreach ($resources as $resource) {
                foreach (['view', 'read', 'create', 'update', 'delete', 'log'] as $action) {
                    unset($permissions["entity_{$resource}_{$action}"]);
                }
            }
            DB::table('roles')->where('id', $role->id)->update([
                'permissions' => json_encode($permissions),
                'updated_at' => now(),
            ]);
        }
    }
};
