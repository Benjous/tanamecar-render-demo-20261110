<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class OwnScopeTest extends TestCase
{
    use DatabaseTransactions;

    public function test_own_scope_blocks_editing_records_owned_by_another_user(): void
    {
        $role = Role::create([
            'name' => 'Own Role '.Str::random(6),
            'permissions' => [
                'entity_slv_locataires_view' => 'yes',
                'entity_slv_locataires_read' => 'all',
                'entity_slv_locataires_update' => 'own',
                'entity_slv_locataires_delete' => 'own',
                'entity_slv_contrats_view' => 'yes',
                'entity_slv_contrats_read' => 'all',
                'entity_slv_contrats_update' => 'own',
            ],
        ]);

        $secretary = User::create([
            'name' => 'Own Secretary',
            'email' => 'own-secretary-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'role_id' => $role->id,
            'is_admin' => false,
            'active' => true,
        ]);
        $admin = User::create([
            'name' => 'Own Admin',
            'email' => 'own-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $ownClient = Client::create([
            'display_name' => 'Client du secrétaire',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $secretary->id,
        ]);
        $otherClient = Client::create([
            'display_name' => 'Client de l’admin',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $admin->id,
        ]);

        $this->actingAs($secretary)->get('/clients/'.$ownClient->id.'/edit')->assertOk();
        $this->actingAs($secretary)->get('/clients/'.$otherClient->id.'/edit')->assertForbidden();
        $this->actingAs($secretary)->put('/clients/'.$otherClient->id, [
            'display_name' => 'Tentative',
            'client_type' => 'particulier',
            'status' => 'actif',
        ])->assertForbidden();

        $this->actingAs($secretary)->get('/clients/'.$otherClient->id)->assertOk();

        $ownContract = Contract::create([
            'reference' => 'OWN-'.Str::random(6),
            'client_id' => $ownClient->id,
            'departure_at' => now(),
            'return_at' => now()->addDay(),
            'daily_rate' => 100,
            'days' => 1,
            'total_amount' => 100,
            'returned' => false,
            'created_by' => $secretary->id,
        ]);
        $otherContract = Contract::create([
            'reference' => 'OTH-'.Str::random(6),
            'client_id' => $otherClient->id,
            'departure_at' => now(),
            'return_at' => now()->addDay(),
            'daily_rate' => 100,
            'days' => 1,
            'total_amount' => 100,
            'returned' => false,
            'created_by' => $admin->id,
        ]);

        $this->actingAs($secretary)->get('/contracts/'.$ownContract->id.'/edit')->assertOk();
        $this->actingAs($secretary)->get('/contracts/'.$otherContract->id.'/edit')->assertForbidden();
    }
}
