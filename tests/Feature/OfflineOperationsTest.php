<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class OfflineOperationsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_offline_create_is_idempotent(): void
    {
        $admin = $this->admin();
        $operationId = (string) Str::uuid();
        $name = 'Offline Idempotent '.Str::random(8);
        $payload = [
            'display_name' => $name,
            'client_type' => 'particulier',
            'status' => 'actif',
        ];
        $headers = [
            'X-Offline-Operation-Id' => $operationId,
            'X-Offline-Expected-Version' => '',
        ];

        $this->actingAs($admin)
            ->withHeaders($headers)
            ->post('/clients', $payload)
            ->assertRedirect();

        $this->actingAs($admin)
            ->withHeaders($headers)
            ->post('/clients', $payload)
            ->assertRedirect();

        $this->assertSame(1, DB::table('clients')->where('display_name', $name)->count());
        $this->assertDatabaseHas('offline_operations', [
            'operation_id' => $operationId,
            'user_id' => $admin->id,
            'status' => 'completed',
        ]);
    }

    public function test_offline_update_with_stale_version_is_a_conflict_and_preserves_server_data(): void
    {
        $admin = $this->admin();
        $client = DB::table('clients')->first();
        $this->assertNotNull($client);

        $before = $client->address;
        $operationId = (string) Str::uuid();

        $this->actingAs($admin)
            ->withHeaders([
                'X-Offline-Operation-Id' => $operationId,
                'X-Offline-Expected-Version' => '2000-01-01T00:00:00Z',
            ])
            ->put('/clients/'.$client->id, [
                'display_name' => 'Ne doit pas écraser',
                'client_type' => 'particulier',
                'status' => 'actif',
            ])
            ->assertStatus(409);

        $this->assertSame($before, DB::table('clients')->where('id', $client->id)->value('address'));
        $this->assertDatabaseHas('offline_operations', [
            'operation_id' => $operationId,
            'status' => 'conflict',
        ]);
    }

    public function test_offline_payment_is_idempotent_and_does_not_double_record(): void
    {
        $admin = $this->admin();
        $contract = DB::table('contracts')->whereNotNull('client_id')->first();
        $this->assertNotNull($contract);
        $operationId = (string) Str::uuid();
        $payload = [
            'contract_id' => $contract->id,
            'amount' => 123.45,
            'payment_method' => 'espece',
            'payment_status' => 'paye',
            'remaining_amount' => 0,
        ];

        $before = DB::table('payments')->count();

        $this->actingAs($admin)
            ->withHeaders(['X-Offline-Operation-Id' => $operationId])
            ->post('/payments', $payload)
            ->assertRedirect();

        $this->actingAs($admin)
            ->withHeaders(['X-Offline-Operation-Id' => $operationId])
            ->post('/payments', $payload)
            ->assertRedirect();

        $this->assertSame($before + 1, DB::table('payments')->count());
        $this->assertSame(1, DB::table('payments')->where('contract_id', $contract->id)->where('amount', 123.45)->count());
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Offline Admin',
            'email' => 'offline-admin-'.Str::random(8).'@example.test',
            'password' => 'OfflineTest!2026',
            'is_admin' => true,
            'active' => true,
            'organization_id' => 1,
        ]);
    }
}
