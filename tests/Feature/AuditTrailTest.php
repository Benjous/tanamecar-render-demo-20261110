<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use DatabaseTransactions;

    public function test_client_create_update_delete_are_traced_with_actor_and_values(): void
    {
        $admin = User::create([
            'name' => 'Audit Admin',
            'email' => 'audit-'.uniqid().'@example.test',
            'password' => 'AuditPass!2026',
            'is_admin' => true,
            'active' => true,
            'organization_id' => 1,
        ]);

        $this->actingAs($admin)->post('/clients', [
            'display_name' => 'CLIENT AUDIT TEST',
            'client_type' => 'particulier',
            'status' => 'actif',
            'phone' => '0600000000',
            'user_id' => 999999,
        ])->assertRedirect();

        $client = Client::query()->where('display_name', 'CLIENT AUDIT TEST')->firstOrFail();

        $create = DB::table('activity_log')
            ->where('user_id', $admin->id)
            ->where('action', 'create')
            ->where('entity_type', 'clients')
            ->where('entity_id', $client->id)
            ->first();

        $this->assertNotNull($create);
        $this->assertSame('CLIENT AUDIT TEST', json_decode($create->after, true)['display_name']);
        $this->assertNotSame(999999, $create->user_id);

        $this->actingAs($admin)->put('/clients/'.$client->id, [
            'display_name' => 'CLIENT AUDIT TEST',
            'client_type' => 'particulier',
            'status' => 'actif',
            'phone' => '0611111111',
        ])->assertRedirect();

        $update = DB::table('activity_log')
            ->where('user_id', $admin->id)
            ->where('action', 'update')
            ->where('entity_type', 'clients')
            ->where('entity_id', $client->id)
            ->first();

        $this->assertNotNull($update);
        $this->assertSame('0600000000', json_decode($update->before, true)['phone']);
        $this->assertSame('0611111111', json_decode($update->after, true)['phone']);

        $this->actingAs($admin)->delete('/clients/'.$client->id)->assertRedirect();

        $delete = DB::table('activity_log')
            ->where('user_id', $admin->id)
            ->where('action', 'delete')
            ->where('entity_type', 'clients')
            ->where('entity_id', $client->id)
            ->first();

        $this->assertNotNull($delete);
        $this->assertSame('CLIENT AUDIT TEST', json_decode($delete->before, true)['display_name']);
        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }
}
