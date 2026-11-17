<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class RefonteMetierTest extends TestCase
{
    use DatabaseTransactions;

    public function test_invoice_requires_due_date_after_issue_and_stores_file_reference(): void
    {
        $admin = $this->admin();
        $client = $this->client();

        $this->actingAs($admin)->post('/invoices', [
            'client_id' => $client->id,
            'issued_at' => '2026-11-16',
            'subject' => 'Test facture',
            'lines' => [['designation' => 'Location', 'quantity' => 2, 'unit_price' => 500, 'vat_rate' => 20]],
        ])->assertSessionHasErrors('due_date');

        $this->actingAs($admin)->post('/invoices', [
            'client_id' => $client->id,
            'issued_at' => '2026-11-16',
            'due_date' => '2026-11-15',
            'lines' => [['designation' => 'Location', 'quantity' => 2, 'unit_price' => 500, 'vat_rate' => 20]],
        ])->assertSessionHasErrors('due_date');

        $this->actingAs($admin)->post('/invoices', [
            'client_id' => $client->id,
            'issued_at' => '2026-11-16',
            'due_date' => '2026-12-16',
            'subject' => 'Test facture',
            'file_reference' => 'DOSSIER-001',
            'lines' => [['designation' => 'Location', 'quantity' => 2, 'unit_price' => 500, 'vat_rate' => 20]],
        ])->assertRedirect();

        $invoice = Invoice::query()->where('client_id', $client->id)->latest('id')->firstOrFail();

        $this->assertSame('DOSSIER-001', $invoice->file_reference);
        $this->assertSame('2026-12-16', $invoice->due_date?->toDateString());
        $this->assertNotSame('', $invoice->reference_normalized);
    }

    public function test_invoice_pdf_header_and_no_header_are_downloadable(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $invoice = Invoice::create([
            'reference' => 'PDF/2026',
            'status' => 'confirmed',
            'issued_at' => '2026-11-16',
            'due_date' => '2026-12-16',
            'client_id' => $client->id,
            'subtotal' => 1000,
            'vat_value' => 200,
            'total' => 1200,
            'created_by' => $admin->id,
        ]);
        InvoiceLine::create([
            'invoice_id' => $invoice->id,
            'designation' => 'Location',
            'quantity' => 2,
            'unit_price' => 500,
            'net_price' => 1000,
            'vat_rate' => 20,
            'vat_value' => 200,
            'price' => 1200,
        ]);

        foreach (['header', 'no-header'] as $variant) {
            $response = $this->actingAs($admin)->get("/invoices/{$invoice->id}/pdf/{$variant}");
            $response->assertOk();
            $response->assertHeader('content-type', 'application/pdf');
        }
    }

    public function test_contract_stores_discount_and_vat_fields(): void
    {
        $admin = $this->admin();
        $client = $this->client();

        $this->actingAs($admin)->post('/contracts', [
            'client_id' => $client->id,
            'first_driver_id' => $client->id,
            'client_is_main_driver' => true,
            'departure_at' => '2026-11-16 10:00:00',
            'return_at' => '2026-11-18 10:00:00',
            'daily_rate' => 100,
            'days' => 2,
            'discount_per_day' => 10,
            'discount_amount' => 0,
            'vat_applicable' => true,
            'total_amount' => 216,
            'first_payment_amount' => 0,
            'first_payment_method' => 'espece',
        ])->assertRedirect();

        $contract = Contract::query()->where('client_id', $client->id)->latest('id')->firstOrFail();

        $this->assertSame('10.00', $contract->discount_per_day);
        $this->assertTrue($contract->vat_applicable);
        $this->assertSame('216.00', $contract->total_amount);
    }

    public function test_client_payment_summary_uses_recorded_payments(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $contract = Contract::create([
            'reference' => 'TEST-PAY-'.uniqid(),
            'client_id' => $client->id,
            'departure_at' => '2026-11-01 10:00:00',
            'return_at' => '2026-11-05 10:00:00',
            'days' => 4,
            'daily_rate' => 250,
            'total_amount' => 1000,
            'returned' => false,
            'created_by' => $admin->id,
        ]);
        Payment::create([
            'contract_id' => $contract->id,
            'amount' => 300,
            'payment_method' => 'espece',
            'payment_status' => 'partiel',
            'display_name' => 'AVANCE-001',
            'created_by' => $admin->id,
        ]);

        $page = $this->actingAs($admin)->get("/clients/{$client->id}")->viewData('page');
        $summary = $page['props']['paymentSummary'];

        $this->assertSame(1000.0, (float) $summary['contracts_total']);
        $this->assertSame(300.0, (float) $summary['paid_total']);
        $this->assertSame(700.0, (float) $summary['remaining_total']);
        $this->assertSame(1, $summary['payments_count']);
        $this->assertSame('Paiement partiel', $page['props']['paymentHistory'][0]['status']);
    }

    public function test_sub_rental_page_lists_vehicles_in_sous_location(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->where('operating_mode', 'sous_location')->firstOrFail();

        $page = $this->actingAs($admin)->get('/sub-rentals')->viewData('page');
        $ids = collect($page['props']['rows'])->pluck('id')->all();

        $this->assertContains($vehicle->id, $ids);
        $this->assertGreaterThan(0, $page['props']['counts']['total']);
    }

    public function test_dashboard_exposes_business_intelligence_payloads(): void
    {
        $admin = $this->admin();

        $page = $this->actingAs($admin)->get('/dashboard')->viewData('page');

        $this->assertArrayHasKey('kpis', $page['props']);
        $this->assertArrayHasKey('statusCounts', $page['props']);
        $this->assertArrayHasKey('monthly', $page['props']);
        $this->assertArrayHasKey('vehiclePerformance', $page['props']);
        $this->assertGreaterThan(0, $page['props']['kpis']['fleet_total']);
        $this->assertSame(81, $page['props']['kpis']['fleet_total']);
    }

    public function test_client_search_returns_identity_and_contact_fields(): void
    {
        $admin = $this->admin();
        $client = $this->client();

        $response = $this->actingAs($admin)->getJson('/clients/search?q='.urlencode($client->display_name));
        $response->assertOk();
        $result = collect($response->json('results'))->firstWhere('id', $client->id);

        $this->assertNotNull($result);
        $this->assertArrayHasKey('first_name', $result);
        $this->assertArrayHasKey('last_name', $result);
        $this->assertArrayHasKey('identity_number', $result);
        $this->assertArrayHasKey('license_number', $result);
        $this->assertArrayHasKey('country_name', $result);
    }

    public function test_return_and_overdue_lists_are_mutually_exclusive(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $today = CarbonImmutable::now('Africa/Casablanca')->startOfDay();

        $normal = Contract::create([
            'reference' => 'TEST-RET-'.uniqid(),
            'client_id' => $client->id,
            'departure_at' => $today->subDays(3),
            'return_at' => $today->addDay()->setTime(12, 0),
            'days' => 4,
            'daily_rate' => 100,
            'total_amount' => 400,
            'returned' => false,
            'created_by' => $admin->id,
        ]);
        $overdue = Contract::create([
            'reference' => 'TEST-LATE-'.uniqid(),
            'client_id' => $client->id,
            'departure_at' => $today->subDays(5),
            'return_at' => $today->subDay()->setTime(12, 0),
            'days' => 4,
            'daily_rate' => 100,
            'total_amount' => 400,
            'returned' => false,
            'created_by' => $admin->id,
        ]);
        $returnedLate = Contract::create([
            'reference' => 'TEST-RETURNED-'.uniqid(),
            'client_id' => $client->id,
            'departure_at' => $today->subDays(5),
            'return_at' => $today->subDay()->setTime(12, 0),
            'days' => 4,
            'daily_rate' => 100,
            'total_amount' => 400,
            'returned' => true,
            'created_by' => $admin->id,
        ]);

        $returnsPage = $this->actingAs($admin)->get("/contracts?view=returns&numero={$normal->id}")->viewData('page');
        $returnsIds = collect($returnsPage['props']['contracts'])->pluck('id')->all();
        $this->assertContains($normal->id, $returnsIds);

        $overdueInReturns = $this->actingAs($admin)->get("/contracts?view=returns&numero={$overdue->id}")->viewData('page');
        $this->assertNotContains($overdue->id, collect($overdueInReturns['props']['contracts'])->pluck('id')->all());

        $overduePage = $this->actingAs($admin)->get("/contracts?status=overdue&view=returns&numero={$overdue->id}")->viewData('page');
        $this->assertContains($overdue->id, collect($overduePage['props']['contracts'])->pluck('id')->all());

        $normalInOverdue = $this->actingAs($admin)->get("/contracts?status=overdue&view=returns&numero={$normal->id}")->viewData('page');
        $this->assertNotContains($normal->id, collect($normalInOverdue['props']['contracts'])->pluck('id')->all());

        foreach (["/contracts?view=returns&numero={$returnedLate->id}", "/contracts?status=overdue&view=returns&numero={$returnedLate->id}"] as $url) {
            $page = $this->actingAs($admin)->get($url)->viewData('page');
            $this->assertNotContains($returnedLate->id, collect($page['props']['contracts'])->pluck('id')->all());
        }
    }

    public function test_contract_update_persists_and_preserves_relations(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $vehicle = Vehicle::query()->firstOrFail();
        $contract = Contract::create([
            'reference' => 'TEST-EDIT-'.uniqid(),
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'first_driver_id' => $client->id,
            'client_is_main_driver' => true,
            'departure_at' => '2026-12-01 09:00:00',
            'return_at' => '2026-12-03 18:00:00',
            'departure_place' => 'Casablanca',
            'return_place' => 'Casablanca',
            'departure_km' => 100,
            'return_km' => 100,
            'daily_rate' => 150,
            'days' => 2,
            'total_amount' => 300,
            'note' => 'Note initiale',
            'returned' => false,
            'created_by' => $admin->id,
        ]);
        $payment = Payment::create([
            'contract_id' => $contract->id,
            'amount' => 100,
            'payment_method' => 'espece',
            'payment_status' => 'partiel',
            'display_name' => 'TEST-EDIT-PAY',
            'created_by' => $admin->id,
        ]);
        $countBefore = Contract::query()->count();

        $this->actingAs($admin)->put("/contracts/{$contract->id}", [
            'client_id' => $client->id,
            'vehicle_id' => $vehicle->id,
            'first_driver_id' => $client->id,
            'second_driver_id' => null,
            'employee_id' => null,
            'client_is_main_driver' => true,
            'departure_at' => '2026-12-02 10:00:00',
            'departure_place' => 'Rabat',
            'departure_km' => 120,
            'return_at' => '2026-12-05 19:00:00',
            'return_place' => 'Marrakech',
            'return_km' => 240,
            'daily_rate' => 175,
            'days' => 3,
            'discount_per_day' => 5,
            'discount_amount' => 0,
            'vat_applicable' => false,
            'total_amount' => 510,
            'deposit' => 500,
            'deductible' => 1000,
            'caution_type' => 'cheque',
            'note' => 'Note modifiée',
        ])->assertRedirect(route('contracts.show', $contract));

        $contract->refresh();
        $this->assertSame('Rabat', $contract->departure_place);
        $this->assertSame('Marrakech', $contract->return_place);
        $this->assertSame('Note modifiée', $contract->note);
        $this->assertSame('510.00', $contract->total_amount);
        $this->assertSame($client->id, $contract->client_id);
        $this->assertSame($vehicle->id, $contract->vehicle_id);
        $this->assertSame($client->id, $contract->first_driver_id);
        $this->assertSame($countBefore, Contract::query()->count());
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'contract_id' => $contract->id]);

        $page = $this->actingAs($admin)->get("/contracts/{$contract->id}/edit")->viewData('page');
        $this->assertSame('Rabat', $page['props']['contract']['departure_place']);
        $this->assertSame('Marrakech', $page['props']['contract']['return_place']);
        $this->assertSame('Note modifiée', $page['props']['contract']['note']);
    }

    public function test_client_search_by_first_name_last_name_and_combined_name(): void
    {
        $admin = $this->admin();
        $client = Client::create([
            'display_name' => 'BENALI ÉLODIE',
            'first_name' => 'Élodie',
            'last_name' => 'Benali',
            'client_type' => 'particulier',
            'status' => 'actif',
            'phone' => '0611111111',
            'identity_number' => 'CIN-ELODIE',
            'license_number' => 'PERMIS-ELODIE',
            'identity_document_type' => 'cin',
        ]);
        $countBefore = Client::query()->count();

        foreach (['elodie', 'ÉLODIE', 'benali elodie', 'elodie benali', 'BENALI'] as $query) {
            $response = $this->actingAs($admin)->getJson('/clients/search?q='.urlencode($query));
            $response->assertOk();
            $result = collect($response->json('results'))->firstWhere('id', $client->id);
            $this->assertNotNull($result, "Recherche sans résultat pour : {$query}");
            $this->assertSame('Élodie', $result['first_name']);
            $this->assertSame('Benali', $result['last_name']);
        }

        $this->assertSame($countBefore, Client::query()->count());
    }

    public function test_invoice_update_persists_lines_discounts_and_preserves_payments(): void
    {
        $admin = $this->admin();
        $client = $this->client();
        $invoice = Invoice::create([
            'reference' => 'EDIT-'.uniqid(),
            'status' => 'confirmed',
            'issued_at' => '2026-11-16',
            'due_date' => '2026-12-16',
            'client_id' => $client->id,
            'subtotal' => 500,
            'vat_value' => 100,
            'total' => 600,
            'created_by' => $admin->id,
        ]);
        InvoiceLine::create([
            'invoice_id' => $invoice->id,
            'designation' => 'Ancienne ligne',
            'quantity' => 1,
            'unit_price' => 500,
            'net_price' => 500,
            'vat_rate' => 20,
            'vat_value' => 100,
            'price' => 600,
        ]);
        $payment = Payment::create([
            'contract_id' => null,
            'amount' => 50,
            'payment_method' => 'espece',
            'payment_status' => 'partiel',
            'display_name' => 'PAY-INVOICE-TEST',
            'created_by' => $admin->id,
        ]);
        $invoiceCount = Invoice::query()->count();

        $this->actingAs($admin)->put("/invoices/{$invoice->id}", [
            'reference' => 'EDIT-'.uniqid(),
            'status' => 'paid',
            'client_id' => $client->id,
            'issued_at' => '2026-11-16',
            'due_date' => '2026-12-20',
            'subject' => 'Facture modifiée',
            'file_reference' => 'DOSSIER-EDIT',
            'note' => 'Modification test',
            'discount_value' => 50,
            'discount_percent' => 10,
            'lines' => [
                ['designation' => 'Prestation modifiée', 'quantity' => 2, 'unit_price' => 500, 'vat_rate' => 20],
            ],
        ])->assertRedirect(route('invoices.show', $invoice));

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertSame('Facture modifiée', $invoice->subject);
        $this->assertSame('850.00', $invoice->subtotal);
        $this->assertSame('170.00', $invoice->vat_value);
        $this->assertSame('1020.00', $invoice->total);
        $this->assertSame($invoiceCount, Invoice::query()->count());
        $this->assertSame(1, $invoice->lines()->count());
        $this->assertSame('Prestation modifiée', $invoice->lines()->first()->designation);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'amount' => 50]);
        $this->assertDatabaseHas('activity_log', ['entity_type' => 'invoices', 'entity_id' => $invoice->id, 'action' => 'update']);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Refonte Admin',
            'email' => 'refonte-'.uniqid().'@example.test',
            'password' => 'RefontePass!2026',
            'is_admin' => true,
            'active' => true,
            'organization_id' => 1,
        ]);
    }

    private function client(): Client
    {
        return Client::create([
            'display_name' => 'CLIENT REFONTE '.uniqid(),
            'first_name' => 'MOHAMED',
            'last_name' => 'REFONTE',
            'client_type' => 'particulier',
            'status' => 'actif',
            'phone' => '0600000000',
            'identity_number' => 'CIN-'.uniqid(),
            'license_number' => 'PERMIS-'.uniqid(),
            'identity_document_type' => 'cin',
        ]);
    }
}
