<?php

namespace Tests\Feature;

use App\Models\AutolocDriverCandidate;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class AddendumModulesTest extends TestCase
{
    use DatabaseTransactions;

    public function test_volume_control_reference_simulation_and_import(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->get('/settings/client-volume')->assertOk();
        $this->actingAs($admin)->put('/settings/client-volume/reference', ['reference' => 2023])->assertRedirect();
        $payload = "CLIENT TEST ADDENDUM,0699990001,ADRESSE TEST\nCLIENT TEST ADDENDUM,0699990001,ADRESSE TEST";
        $simulation = $this->actingAs($admin)->postJson('/settings/client-volume/simulate', ['payload' => $payload]);
        $simulation->assertOk();
        $this->assertSame(1, $simulation->json('new'));
        $this->assertSame(1, $simulation->json('duplicates'));
        $this->actingAs($admin)->post('/settings/client-volume/import', ['payload' => $payload])->assertRedirect();
        $this->assertSame(1, Client::query()->where('display_name', 'CLIENT TEST ADDENDUM')->count());
    }

    public function test_search_is_accent_and_case_tolerant(): void
    {
        $admin = $this->admin();
        Client::create([
            'display_name' => 'Ã‰lodie TÃ©st',
            'phone' => '0600000099',
            'address' => 'Adresse test',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $admin->id,
        ]);
        $response = $this->actingAs($admin)->getJson('/clients/search?q=elodie%20test');
        $response->assertOk();
        $this->assertTrue(collect($response->json('results'))->contains(fn ($row) => $row['display_name'] === 'Ã‰lodie TÃ©st'));
    }

    public function test_driver_matching_page_and_confirmed_client_creation(): void
    {
        $admin = $this->admin();
        $candidate = AutolocDriverCandidate::create([
            'source_row' => random_int(900000, 999999),
            'display_name' => 'CONDUCTEUR ADDENDUM',
            'phone' => '0611111199',
            'address' => 'Adresse conducteur',
            'status' => 'pending',
        ]);
        $this->actingAs($admin)->get('/clients/matching')->assertOk();
        $this->actingAs($admin)->post("/clients/matching/{$candidate->id}/create")->assertRedirect();
        $candidate->refresh();
        $this->assertSame('matched', $candidate->status);
        $this->assertNotNull($candidate->matched_client_id);
        $this->assertDatabaseHas('clients', ['display_name' => 'CONDUCTEUR ADDENDUM']);
    }

    public function test_manipulation_billing_and_versions_pages(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->get('/manipulation')->assertOk();
        $this->actingAs($admin)->get('/billing')->assertOk();
        $this->actingAs($admin)->get('/billing/versions')->assertOk();
    }

    public function test_sub_rentals_page_and_update_preserve_recorded_values(): void
    {
        $admin = $this->admin();
        $row = \App\Models\SubRental::create([
            'source_id' => random_int(9000000, 9999999),
            'source_row' => 1,
            'match_status' => 'unmatched',
            'company' => 'TEST',
            'vehicle_name' => 'Voiture test',
            'client_name' => 'Client test',
            'days_recorded' => 3,
            'rate_recorded' => 100,
            'total_recorded' => 300,
            'price_recorded' => 450,
            'profit_recorded' => 150,
            'advance_recorded' => 0,
            'credit_recorded' => 450,
            'days_current' => 3,
            'rate_current' => 100,
            'total_current' => 300,
            'price_current' => 450,
            'profit_current' => 150,
            'advance_current' => 0,
            'credit_current' => 450,
        ]);
        $this->actingAs($admin)->get('/sub-rentals')->assertOk();
        $show = $this->actingAs($admin)->get("/sub-rentals/{$row->id}")->viewData('page');
        $this->assertSame(300.0, (float) $show['props']['calculated']['total']);
        $this->actingAs($admin)->put("/sub-rentals/{$row->id}", [
            'days_current' => 4, 'rate_current' => 100, 'total_current' => 400,
            'price_current' => 450, 'profit_current' => 50, 'advance_current' => 50, 'credit_current' => 400,
        ])->assertRedirect("/sub-rentals/{$row->id}");
        $row->refresh();
        $this->assertSame('300.00000000', $row->total_recorded);
        $this->assertSame('400.00000000', $row->total_current);
        $this->assertSame($admin->id, $row->modified_by);
    }

    public function test_archive_design_command_and_dashboard_payloads(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->get('/settings/archive')->assertOk();
        $this->actingAs($admin)->get('/settings/design-system')->assertOk();
        $this->actingAs($admin)->get('/dashboard')->assertOk();
        $this->actingAs($admin)->getJson('/command-search?q=client')->assertOk();
        $archive = $this->actingAs($admin)->get('/settings/archive')->viewData('page');
        $this->assertCount(8, $archive['props']['dryRun']);
        $this->assertSame(0, array_sum(array_column($archive['props']['dryRun'], 'count')));
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Addendum Admin',
            'email' => 'addendum-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }
}

