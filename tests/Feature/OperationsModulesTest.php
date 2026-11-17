<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Vehicle;
use App\Services\ArchiveService;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class OperationsModulesTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): User
    {
        return User::create([
            'name' => 'Operations Admin',
            'email' => 'operations-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }

    public function test_operation_pages_and_finance_overview_are_available(): void
    {
        $admin = $this->admin();
        foreach (['/finance', '/data/charges', '/data/agenda', '/data/client_credits', '/data/profit_entries', '/data/incidents', '/settings/backups'] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
    }

    public function test_charge_agenda_profit_and_incident_can_be_created(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/data/charges', [
            'charge_date' => '2026-11-09',
            'description' => 'Charge test',
            'category' => 'charge_fixe',
            'amount' => '125.50',
            'vat' => '20.00',
            'destination' => 'Agence',
        ])->assertRedirect();
        $this->actingAs($admin)->post('/data/agenda', [
            'event_date' => '2026-11-10',
            'start_time' => '09:30',
            'subject' => 'Rendez-vous test',
            'status' => 'planifie',
        ])->assertRedirect();
        $this->actingAs($admin)->post('/data/profit_entries', [
            'entry_date' => '2026-11-09',
            'description' => 'Bénéfice test',
            'source' => 'Location',
            'amount' => '300.00',
        ])->assertRedirect();
        $this->actingAs($admin)->post('/data/incidents', [
            'incident_date' => '2026-11-09',
            'description' => 'Sinistre test',
            'amount' => '450.00',
            'status' => 'ouvert',
        ])->assertRedirect();

        $this->assertDatabaseHas('charges', ['description' => 'Charge test', 'amount' => 125.50]);
        $this->assertDatabaseHas('agenda_events', ['subject' => 'Rendez-vous test']);
        $this->assertDatabaseHas('profit_entries', ['description' => 'Bénéfice test']);
        $this->assertDatabaseHas('incidents', ['description' => 'Sinistre test']);
    }

    public function test_archived_records_are_excluded_from_lists_and_exports(): void
    {
        $baseline = DB::table('contracts')->count();
        $contractId = (int) DB::table('contracts')->value('id');
        DB::table('archived_records')->insert([
            'entity_type' => 'contracts',
            'record_id' => $contractId,
            'batch_id' => 'test-archive-'.Str::random(6),
            'business_date' => '2023-12-31',
            'created_at' => now(),
        ]);

        $this->assertFalse(Contract::query()->whereKey($contractId)->exists());
        $this->assertSame($baseline - 1, ArchiveService::exclude(DB::table('contracts'), 'contracts', 'contracts.id')->count());
    }

    public function test_vehicle_can_be_archived_and_restored(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $this->actingAs($admin)->post("/vehicles/{$vehicle->id}/archive")->assertRedirect('/vehicles');
        $this->assertFalse(Vehicle::query()->whereKey($vehicle->id)->exists());
        $batch = DB::table('archived_records')->where('entity_type', 'vehicles')->where('record_id', $vehicle->id)->value('batch_id');
        $this->actingAs($admin)->post('/settings/archive/restore', ['batch' => $batch])->assertRedirect();
        $this->assertTrue(Vehicle::query()->whereKey($vehicle->id)->exists());
    }

    public function test_client_credit_is_linked_to_a_client(): void
    {
        $admin = $this->admin();
        $client = Client::create([
            'display_name' => 'Client crédit test',
            'phone' => '0600000001',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $admin->id,
        ]);
        $this->actingAs($admin)->post('/data/client_credits', [
            'client_id' => $client->id,
            'credit_date' => '2026-11-09',
            'advance' => '500.00',
            'remaining' => '250.00',
        ])->assertRedirect();
        $this->assertDatabaseHas('client_credits', ['client_id' => $client->id, 'advance' => 500.00, 'remaining' => 250.00]);
    }
}
