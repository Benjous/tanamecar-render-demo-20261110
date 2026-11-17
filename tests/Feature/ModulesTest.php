<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ModulesTest extends TestCase
{
    use DatabaseTransactions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Test Admin',
            'email' => 'test-modules-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $this->actingAs($this->admin);
    }

    public function test_generic_reference_crud(): void
    {
        $this->post('/data/slv_marques', ['name' => 'Marque Test'])->assertRedirect();
        $brand = DB::table('brands')->where('name', 'Marque Test')->first();
        $this->assertNotNull($brand);

        $this->put('/data/slv_marques/'.$brand->id, ['name' => 'Marque Test 2'])->assertRedirect();
        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'Marque Test 2']);

        $this->delete('/data/slv_marques/'.$brand->id)->assertRedirect();
        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_contract_pdf_is_generated(): void
    {
        $contract = Contract::firstOrFail();
        $response = $this->get('/contracts/'.$contract->id.'/pdf');
        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_invoice_pdf_is_generated(): void
    {
        $invoice = Invoice::firstOrFail();
        $response = $this->get('/invoices/'.$invoice->id.'/pdf');
        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_imported_document_can_be_downloaded(): void
    {
        $document = DB::table('documents')->where('id', '<', 1000000)->first();
        $this->assertNotNull($document);
        $this->get('/documents/'.$document->id)->assertOk();
    }

    public function test_global_search_returns_contract(): void
    {
        $response = $this->get('/search?q=020418');
        $response->assertOk();
        $response->assertSee('020418');
    }

    public function test_contract_filters_work(): void
    {
        $this->get('/contracts?status=open')->assertOk();
        $this->get('/contracts?status=returned')->assertOk();
        $this->get('/contracts?q=020418')->assertOk();
    }
}
