<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Quote;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdditionalModulesTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Test Admin',
            'email' => 'test-extra-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $this->actingAs($this->admin);
    }

    public function test_quote_creation_computes_totals(): void
    {
        $client = Client::create([
            'display_name' => 'Client Devis',
            'client_type' => 'entreprise',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);

        $this->post('/quotes', [
            'client_id' => $client->id,
            'issued_at' => now()->toDateString(),
            'lines' => [
                ['designation' => 'Prestation', 'quantity' => 1, 'unit_price' => 1000, 'vat_rate' => 20],
            ],
        ])->assertRedirect();

        $quote = Quote::where('client_id', $client->id)->firstOrFail();
        $this->assertEquals(1200, (float) $quote->total);
    }

    public function test_csv_export_returns_data(): void
    {
        $response = $this->get('/exports/contracts.csv');
        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_empty_modules_pages_render(): void
    {
        foreach (['slv_reservations', 'slv_maintenance', 'credits_vehicules', 'slv_whatsapp', 'slv_communication', 'slv_configurations', 'slv_suivi'] as $entity) {
            $this->get('/data/'.$entity)->assertOk();
        }
    }

    public function test_client_document_upload_creates_media(): void
    {
        Storage::fake('local');
        $client = Client::create([
            'display_name' => 'Client Document',
            'client_type' => 'particulier',
            'status' => 'actif',
            'created_by' => $this->admin->id,
        ]);

        $this->post('/clients', [
            'display_name' => 'Client Document 2',
            'client_type' => 'particulier',
            'status' => 'actif',
            'identity_document' => [UploadedFile::fake()->create('identite.pdf', 100, 'application/pdf')],
        ])->assertRedirect();

        $created = Client::where('display_name', 'Client Document 2')->firstOrFail();
        $this->assertDatabaseHas('media', [
            'mediable_type' => 'slv_locataires',
            'mediable_id' => $created->id,
            'collection' => 'document_identite',
        ]);
    }

    public function test_company_settings_update(): void
    {
        $this->put('/settings/company', [
            'name' => 'TanameCar Test',
            'brand_name' => 'TANAMECAR',
            'currency' => 'MAD',
            'timezone' => 'Africa/Casablanca',
            'date_format' => 'd/m/Y',
            'theme_primary' => '#0B1F3A',
            'theme_accent' => '#1E6FD9',
        ])->assertRedirect();

        $this->assertDatabaseHas('settings', ['key' => 'company.name']);
        $this->assertSame('"TanameCar Test"', DB::table('settings')->where('key', 'company.name')->value('value'));
    }
}
