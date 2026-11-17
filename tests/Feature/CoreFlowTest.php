<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class CoreFlowTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Test Admin',
            'email' => 'test-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $this->actingAs($this->admin);
    }

    public function test_contract_creation_updates_vehicle_and_creates_payment(): void
    {
        $client = Client::create([
            'display_name' => 'Client Test',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);
        $vehicle = Vehicle::create([
            'display_name' => 'Voiture Test',
            'status' => 'disponible',
            'operating_mode' => 'location',
            'plate_number' => 'TEST-'.Str::random(6),
            'daily_rate' => 200,
        ]);

        $response = $this->post('/contracts', [
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'departure_at' => now()->format('Y-m-d H:i:s'),
            'return_at' => now()->addDays(3)->format('Y-m-d H:i:s'),
            'daily_rate' => 200,
            'days' => 3,
            'total_amount' => 600,
            'first_payment_amount' => 200,
            'first_payment_method' => 'espece',
        ]);

        $response->assertRedirect();
        $contract = Contract::where('client_id', $client->id)->firstOrFail();
        $this->assertSame('en_location', $vehicle->fresh()->status);
        $this->assertDatabaseHas('payments', ['contract_id' => $contract->id, 'amount' => 200]);
        $this->assertDatabaseHas('notifications', ['user_id' => $this->admin->id, 'type' => 'contract.created']);
        $this->get('/contracts/'.$contract->id)->assertOk();
        $this->get('/notifications')->assertOk();
    }

    public function test_contract_return_sets_vehicle_available_and_updates_km(): void
    {
        $client = Client::create([
            'display_name' => 'Client Retour',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);
        $vehicle = Vehicle::create([
            'display_name' => 'Voiture Retour',
            'status' => 'en_location',
            'operating_mode' => 'location',
            'plate_number' => 'RET-'.Str::random(6),
            'km' => 1000,
        ]);
        $contract = Contract::create([
            'reference' => 'TEST-'.Str::random(6),
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'departure_at' => now(),
            'return_at' => now()->addDays(2),
            'daily_rate' => 100,
            'days' => 2,
            'total_amount' => 200,
            'returned' => false,
        ]);

        $this->post('/contracts/'.$contract->id.'/return', ['return_km' => 1250])->assertRedirect();

        $this->assertTrue($contract->fresh()->returned);
        $this->assertSame('disponible', $vehicle->fresh()->status);
        $this->assertEquals(1250, $vehicle->fresh()->km);
    }

    public function test_invoice_creation_computes_totals(): void
    {
        $client = Client::create([
            'display_name' => 'Client Facture',
            'client_type' => 'entreprise',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);

        $response = $this->post('/invoices', [
            'client_id' => $client->id,
            'issued_at' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subject' => 'Test facture',
            'lines' => [
                ['designation' => 'Location', 'quantity' => 2, 'unit_price' => 500, 'vat_rate' => 20],
            ],
        ]);

        $response->assertRedirect();
        $invoice = Invoice::where('client_id', $client->id)->firstOrFail();
        $this->assertEquals(1000, (float) $invoice->subtotal);
        $this->assertEquals(200, (float) $invoice->vat_value);
        $this->assertEquals(1200, (float) $invoice->total);
        $this->assertCount(1, $invoice->lines);
    }
}
