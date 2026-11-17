<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleDeadline;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListFiltersTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Filtres Admin',
            'email' => 'filtres-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $this->actingAs($this->admin);
    }

    private function ids(string $url, string $key): array
    {
        $response = $this->get($url);
        $response->assertOk();
        $page = $response->viewData('page');

        return collect($page['props'][$key] ?? [])->pluck('id')->all();
    }

    public function test_client_search_is_partial_case_and_accent_insensitive(): void
    {
        $client = Client::create([
            'display_name' => 'Élodie Zéphyrine '.Str::random(5),
            'client_type' => 'particulier',
            'status' => 'actif',
            'phone' => '0612345678',
            'created_by' => $this->admin->id,
        ]);

        $this->assertContains($client->id, $this->ids('/clients?q=elod', 'clients'));
        $this->assertContains($client->id, $this->ids('/clients?q=ELOD', 'clients'));
        $this->assertContains($client->id, $this->ids('/clients?q=0612', 'clients'));
    }

    public function test_contract_search_combines_text_and_status(): void
    {
        $client = Client::create([
            'display_name' => 'Client Filtre '.Str::random(5),
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);
        $vehicle = Vehicle::create([
            'display_name' => 'Voiture Filtre',
            'status' => 'disponible',
            'operating_mode' => 'location',
            'plate_number' => 'FILTRE-'.Str::random(5),
        ]);
        $reference = 'ZZSEARCH'.Str::upper(Str::random(5));
        $contract = Contract::create([
            'reference' => $reference,
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'departure_at' => now(),
            'return_at' => now()->addDays(2),
            'daily_rate' => 100,
            'days' => 2,
            'total_amount' => 200,
            'returned' => false,
        ]);

        $this->assertContains($contract->id, $this->ids('/contracts?q=zzsearch&status=open', 'contracts'));
        $this->assertNotContains($contract->id, $this->ids('/contracts?q=zzsearch&status=returned', 'contracts'));
    }

    public function test_payment_search_combines_contract_and_status_without_bypass(): void
    {
        $client = Client::create([
            'display_name' => 'Client Paiement '.Str::random(5),
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);
        $reference = 'PAYSEARCH'.Str::upper(Str::random(5));
        $contract = Contract::create([
            'reference' => $reference,
            'client_id' => $client->id,
            'departure_at' => now(),
            'return_at' => now()->addDays(1),
            'daily_rate' => 100,
            'days' => 1,
            'total_amount' => 100,
            'returned' => false,
        ]);
        $payment = Payment::create([
            'contract_id' => $contract->id,
            'amount' => 100,
            'payment_method' => 'espece',
            'payment_status' => 'paye',
            'created_by' => $this->admin->id,
        ]);

        $this->assertContains($payment->id, $this->ids('/payments?q=paysearch&status=paye', 'payments'));
        $this->assertNotContains($payment->id, $this->ids('/payments?q=paysearch&status=impaye', 'payments'));
    }

    public function test_generic_list_search_and_select_filter_are_combined(): void
    {
        $id = DB::table('charges')->insertGetId([
            'charge_date' => now()->toDateString(),
            'description' => 'Recherche Électricité '.Str::random(5),
            'category' => 'autre',
            'amount' => 123.45,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertContains($id, $this->ids('/data/charges?q=electricite&category=autre', 'rows'));
        $this->assertNotContains($id, $this->ids('/data/charges?q=electricite&category=loyer', 'rows'));
    }

    public function test_deadline_search_combines_vehicle_text_and_status(): void
    {
        $vehicle = Vehicle::create([
            'display_name' => 'Voiture Échéance',
            'status' => 'disponible',
            'operating_mode' => 'location',
            'plate_number' => 'ECH-'.Str::random(5),
        ]);
        $deadline = VehicleDeadline::create([
            'vehicle_id' => $vehicle->id,
            'title' => 'Contrôle Filtre '.Str::random(5),
            'due_date' => now()->subDay()->toDateString(),
            'source' => 'manual',
        ]);

        $this->assertContains($deadline->id, $this->ids('/deadlines?q=filtre&status=overdue', 'rows'));
        $this->assertNotContains($deadline->id, $this->ids('/deadlines?q=filtre&status=done', 'rows'));
    }

    public function test_dashboard_no_longer_exposes_monthly_chart_data(): void
    {
        $response = $this->get('/dashboard');
        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertArrayNotHasKey('charts', $page['props']);
        $this->assertArrayHasKey('stats', $page['props']);
        $this->assertArrayNotHasKey('monthly', $page['props']['stats']);
    }

    public function test_database_seeder_does_not_create_a_fake_user_without_explicit_configuration(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
        $this->assertDatabaseMissing('users', ['name' => 'Test User']);
    }
}
