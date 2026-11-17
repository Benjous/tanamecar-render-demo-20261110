<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleAmortization;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class FinalModulesTest extends TestCase
{
    use DatabaseTransactions;

    public function test_recap_returns_clickable_counts(): void
    {
        $admin = $this->admin();
        $response = $this->actingAs($admin)->getJson('/recap');
        $response->assertOk();
        $payload = $response->json();
        $this->assertSame(30, $payload['threshold_days']);
        $this->assertCount(4, $payload['items']);
        $this->assertSame(array_sum(array_column($payload['items'], 'count')), $payload['total']);
        foreach ($payload['items'] as $item) {
            $this->assertStringStartsWith('/', $item['href']);
        }
    }

    public function test_report_lists_user_and_date_without_ip(): void
    {
        $admin = $this->admin();
        $response = $this->actingAs($admin)->get('/reports');
        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertArrayNotHasKey('ip', $page['props']);
        foreach ($page['props']['rows'] as $row) {
            $this->assertArrayNotHasKey('ip', (array) $row);
            $this->assertArrayHasKey('user_name', (array) $row);
            $this->assertArrayHasKey('created_at', (array) $row);
        }
    }

    public function test_amortization_keeps_recorded_values_and_tracks_modifier(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $row = VehicleAmortization::create([
            'source_credit_id' => random_int(900000, 999999),
            'source_row' => 1,
            'vehicle_id' => $vehicle->id,
            'match_status' => 'matched',
            'source_vehicle_name' => 'Voiture test',
            'source_plate' => 'TEST-AMORT',
            'revenue_recorded' => '1000.00000000',
            'credit_recorded' => '400.00000000',
            'balance_recorded' => '600.00000000',
            'balance_current' => '600.00000000',
        ]);
        $this->actingAs($admin)->get('/vehicle-amortizations')->assertOk();
        $show = $this->actingAs($admin)->get("/vehicle-amortizations/{$row->id}")->viewData('page');
        $this->assertSame(600.0, (float) $show['props']['calculated']['balance']);
        $this->assertSame(0.0, (float) $show['props']['difference']);

        $this->actingAs($admin)->put("/vehicle-amortizations/{$row->id}", [
            'revenue_current' => '1100',
            'credit_current' => '400',
            'balance_current' => '700',
        ])->assertRedirect("/vehicle-amortizations/{$row->id}");
        $row->refresh();
        $this->assertSame('1000.00000000', $row->revenue_recorded);
        $this->assertSame('1100.00000000', $row->revenue_current);
        $this->assertSame($admin->id, $row->modified_by);
        $this->assertNotNull($row->modified_at);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Final Admin',
            'email' => 'final-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }
}
