<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\TimelineService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class FinalisationTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): User
    {
        return User::create([
            'name' => 'Finalisation Admin',
            'email' => 'finalisation-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }

    public function test_reservation_is_converted_to_contract(): void
    {
        $admin = $this->admin();
        $client = Client::query()->firstOrFail();
        $vehicle = Vehicle::query()->firstOrFail();
        $id = DB::table('reservations')->insertGetId([
            'reference' => 'RES-TEST-'.Str::random(4),
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'departure_at' => now()->addDay(),
            'return_at' => now()->addDays(3),
            'days' => 2,
            'daily_rate' => 300,
            'total_amount' => 600,
            'status' => 'confirmee',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $before = Contract::query()->count();
        $this->actingAs($admin)->post("/reservations/{$id}/convert")->assertRedirect();
        $this->assertSame($before + 1, Contract::query()->count());
        $row = DB::table('reservations')->where('id', $id)->first();
        $this->assertSame('convertie', $row->status);
        $this->assertNotNull($row->converted_contract_id);
        $this->assertDatabaseHas('contracts', ['id' => $row->converted_contract_id, 'client_id' => $client->id, 'total_amount' => 600]);
    }

    public function test_maintenance_next_due_is_computed(): void
    {
        $admin = $this->admin();
        $type = DB::table('maintenance_types')->where('km_interval', '>', 0)->first();
        $vehicle = Vehicle::query()->firstOrFail();
        $this->actingAs($admin)->post('/data/slv_maintenance', [
            'maintenance_type_id' => $type->id,
            'vehicle_id' => $vehicle->id,
            'current_km' => 20000,
            'name' => 'Entretien test',
        ])->assertRedirect();
        $row = DB::table('maintenance_events')->where('name', 'Entretien test')->first();
        $this->assertNotNull($row);
        $this->assertEquals(20000 + (float) $type->km_interval, (float) $row->next_km);
    }

    public function test_generic_duplicate_creates_a_copy(): void
    {
        $admin = $this->admin();
        $id = DB::table('charges')->insertGetId([
            'charge_date' => now()->toDateString(),
            'description' => 'Charge à dupliquer',
            'category' => 'autre',
            'amount' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $before = DB::table('charges')->count();
        $this->actingAs($admin)->post("/data/charges/{$id}/duplicate")->assertRedirect();
        $this->assertSame($before + 1, DB::table('charges')->count());
    }

    public function test_bulk_duplicate_creates_selected_copies(): void
    {
        $admin = $this->admin();
        $ids = [];
        foreach ([1, 2] as $index) {
            $ids[] = DB::table('charges')->insertGetId([
                'charge_date' => now()->toDateString(),
                'description' => 'Charge bulk '.$index,
                'category' => 'autre',
                'amount' => 10 * $index,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        $before = DB::table('charges')->count();
        $this->actingAs($admin)->post('/data/charges/bulk-duplicate', ['ids' => $ids])->assertRedirect();
        $this->assertSame($before + 2, DB::table('charges')->count());
    }

    public function test_contract_can_be_duplicated(): void
    {
        $admin = $this->admin();
        $contract = Contract::query()->firstOrFail();
        $before = Contract::query()->count();
        $this->actingAs($admin)->post("/contracts/{$contract->id}/duplicate")->assertRedirect();
        $this->assertSame($before + 1, Contract::query()->count());
    }

    public function test_teams_can_be_created_updated_and_deleted(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/settings/teams', ['name' => 'Équipe test', 'member_ids' => [$admin->id]])->assertRedirect();
        $team = DB::table('teams')->where('name', 'Équipe test')->first();
        $this->assertNotNull($team);
        $this->assertDatabaseHas('team_user', ['team_id' => $team->id, 'user_id' => $admin->id]);
        $this->actingAs($admin)->put("/settings/teams/{$team->id}", ['name' => 'Équipe modifiée', 'member_ids' => []])->assertRedirect();
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'name' => 'Équipe modifiée']);
        $this->actingAs($admin)->delete("/settings/teams/{$team->id}")->assertRedirect();
        $this->assertDatabaseMissing('teams', ['id' => $team->id]);
    }

    public function test_custom_pdf_template_is_used(): void
    {
        $admin = $this->admin();
        $contract = Contract::query()->firstOrFail();
        $templateId = DB::table('contract_templates')->value('id');
        DB::table('contract_templates')->where('id', $templateId)->update([
            'template_html' => '<h1>{{reference}}</h1><p>{{client}}</p>',
            'updated_at' => now(),
        ]);
        $response = $this->actingAs($admin)->get("/contracts/{$contract->id}/pdf");
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
    }

    public function test_two_factor_page_exposes_otpauth_for_qr(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/settings/security/enable')->assertRedirect();
        $response = $this->actingAs($admin)->get('/settings/security');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->where('otpauth', fn ($value) => is_string($value) && str_starts_with($value, 'otpauth://')));
    }

    public function test_client_and_vehicle_timelines_are_available(): void
    {
        $client = Client::query()->firstOrFail();
        $vehicle = Vehicle::query()->firstOrFail();
        $service = app(TimelineService::class);
        $this->assertIsArray($service->forClient($client->id));
        $this->assertIsArray($service->forVehicle($vehicle->id));
    }
}
