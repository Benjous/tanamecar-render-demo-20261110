<?php

namespace Tests\Feature;

use App\Models\AutolocTraiteSummary;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleInstallment;
use App\Services\AutolocTraiteImportService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class VehicleInstallmentsTest extends TestCase
{
    use DatabaseTransactions;

    public function test_list_counter_matches_all_rows_and_filter_count(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $before = VehicleInstallment::query()->count();
        $beforeUnpaid = VehicleInstallment::query()->where('status', 'unpaid')->count();
        $this->makeInstallment($vehicle, 'paid');
        $this->makeInstallment($vehicle, 'unpaid');

        $response = $this->actingAs($admin)->get('/vehicle-installments');
        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertSame($before + 2, $page['props']['stats']['count']);
        $this->assertCount($before + 2, $page['props']['installments']);

        $filtered = $this->actingAs($admin)->get('/vehicle-installments?status=unpaid')->viewData('page');
        $this->assertSame($beforeUnpaid + 1, $filtered['props']['stats']['count']);
        $this->assertSame($beforeUnpaid + 1, $filtered['props']['stats']['unpaid_count']);
    }

    public function test_create_and_update_keep_imported_values_and_record_modifier_without_ip(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $entry = VehicleInstallment::create([
            'vehicle_id' => $vehicle->id,
            'origin' => 'autoloc',
            'amount_recorded' => '123.456000',
            'amount_current' => '123.456000',
            'amount_text' => '123.456',
            'due_date' => '2025-05-04',
            'date_recorded' => '2025-05-04',
            'description' => 'Historique',
            'description_recorded' => 'Historique',
            'status' => 'paid',
            'status_recorded' => 'paid',
            'source_key' => 'test-source-'.Str::random(8),
        ]);

        $response = $this->actingAs($admin)->put("/vehicle-installments/{$entry->id}", [
            'vehicle_id' => $vehicle->id,
            'amount_current' => '125.500000',
            'due_date' => '2025-05-05',
            'description' => 'Corrigée sans écraser la valeur source',
            'status' => 'unpaid',
        ]);
        $response->assertRedirect("/vehicle-installments/{$entry->id}");
        $entry->refresh();
        $this->assertSame('123.456000', $entry->amount_recorded);
        $this->assertSame('125.500000', $entry->amount_current);
        $this->assertSame('2025-05-04', $entry->date_recorded->toDateString());
        $this->assertSame('2025-05-05', $entry->due_date->toDateString());
        $this->assertSame('paid', $entry->status_recorded);
        $this->assertSame('unpaid', $entry->status);
        $this->assertSame($admin->id, $entry->modified_by);
        $this->assertNotNull($entry->modified_at);
        $this->assertArrayNotHasKey('ip', $entry->getAttributes());

        $this->actingAs($admin)->get("/vehicle-installments/{$entry->id}")->assertOk();
    }

    public function test_store_validates_and_creates_a_manual_traite(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $response = $this->actingAs($admin)->post('/vehicle-installments', [
            'vehicle_id' => $vehicle->id,
            'amount_current' => '1250.375',
            'due_date' => '2025-05-04',
            'description' => 'Nouvelle traite',
            'status' => 'unpaid',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('vehicle_installments', [
            'vehicle_id' => $vehicle->id,
            'amount_current' => '1250.375000',
            'status' => 'unpaid',
            'origin' => 'manual',
            'created_by' => $admin->id,
        ]);
    }

    public function test_csv_export_uses_the_active_filters_and_includes_recorded_values(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $this->makeInstallment($vehicle, 'paid');
        $this->makeInstallment($vehicle, 'unpaid');

        $response = $this->actingAs($admin)->get('/vehicle-installments/export.csv?status=paid');
        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Montant enregistré', $response->streamedContent());
        $this->assertStringContainsString('Feature test', $response->streamedContent());
        $this->assertStringNotContainsString('unpaid', $response->streamedContent());
    }

    public function test_route_permissions_are_enforced_for_view_and_create(): void
    {
        $role = Role::create([
            'name' => 'Traites lecture seule '.Str::random(5),
            'permissions' => ['entity_vehicle_installments_view' => 'all'],
        ]);
        $reader = User::create([
            'name' => 'Traites Reader',
            'email' => 'traite-reader-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'role_id' => $role->id,
            'is_admin' => false,
            'active' => true,
        ]);
        $vehicle = Vehicle::query()->firstOrFail();
        $entry = $this->makeInstallment($vehicle, 'unpaid');

        $this->actingAs($reader)->get('/vehicle-installments')->assertOk();
        $this->actingAs($reader)->get('/vehicle-installments/create')->assertForbidden();
        $this->actingAs($reader)->post('/vehicle-installments', [])->assertForbidden();
        $this->actingAs($reader)->get("/vehicle-installments/{$entry->id}/edit")->assertForbidden();
        $this->actingAs($reader)->put("/vehicle-installments/{$entry->id}", [
            'vehicle_id' => $vehicle->id,
            'amount_current' => '75',
            'due_date' => '2025-01-01',
            'description' => 'No permission',
            'status' => 'paid',
        ])->assertForbidden();

        $blocked = User::create([
            'name' => 'No Traites Access',
            'email' => 'traite-denied-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'role_id' => Role::create(['name' => 'No Traites '.Str::random(5), 'permissions' => []])->id,
            'is_admin' => false,
            'active' => true,
        ]);
        $this->actingAs($blocked)->get('/vehicle-installments')->assertForbidden();
    }

    public function test_import_preview_and_insert_preserve_existing_rows_and_refuse_duplicate_import(): void
    {
        $vehicle = Vehicle::query()->firstOrFail();
        $sentinel = $this->makeInstallment($vehicle, 'unpaid');
        $dataset = $this->importFixture($vehicle->id);
        $importer = app(AutolocTraiteImportService::class);
        $baseline = (float) VehicleInstallment::query()->where('origin', 'autoloc')->sum('amount_recorded');

        $this->assertSame([
            'summaries' => 1,
            'installments' => 2,
            'recorded_amount_sum' => 150.5,
            'matched_summaries' => 1,
            'unmatched_summaries' => 0,
            'ambiguous_summaries' => 0,
        ], $importer->preview($dataset));

        $result = $importer->import($dataset);
        $this->assertSame(1, $result['summaries_inserted']);
        $this->assertSame(2, $result['installments_inserted']);
        $this->assertSame(round($baseline + 150.5, 2), $result['recorded_amount_sum']);
        $this->assertSame(1, AutolocTraiteSummary::query()->where('source_vehicle_id', 990001)->count());
        $this->assertSame(2, VehicleInstallment::query()->where('source_vehicle_id', 990001)->count());
        $stagedDataset = $importer->exportFromStaging();
        $stagedFixture = collect($stagedDataset['vehicles'])->firstWhere('autolocVehicleId', 990001);
        $this->assertNotNull($stagedFixture);
        $this->assertCount(2, $stagedFixture['payments']);
        $this->assertSame(150.5, round((float) collect($stagedFixture['payments'])->sum(fn (array $row) => (float) $row['amountText']), 2));
        $summary = AutolocTraiteSummary::query()->where('source_vehicle_id', 990001)->firstOrFail();
        $summaryPage = $this->actingAs($this->admin())->get("/vehicle-installment-summaries/{$summary->id}")->viewData('page')['props'];
        $this->assertSame(2, $summaryPage['calculated']['paid_months']);
        $this->assertSame(0, $summaryPage['calculated']['remaining_months']);
        $this->assertSame(0.0, $summaryPage['differences']['total_amount']);
        $this->assertSame(0.0, $summaryPage['differences']['paid_amount']);

        $sentinel->refresh();
        $this->assertSame('50.000000', $sentinel->amount_current);
        $this->assertSame('unpaid', $sentinel->status);

        try {
            $importer->import($dataset);
            $this->fail('A duplicate import must be refused.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('existent déjà', $exception->getMessage());
        }
        $this->assertSame(1, AutolocTraiteSummary::query()->where('source_vehicle_id', 990001)->count());
        $this->assertSame(2, VehicleInstallment::query()->where('source_vehicle_id', 990001)->count());
        $this->assertSame('50.000000', $sentinel->fresh()->amount_current);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Traite Admin',
            'email' => 'traite-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }

    private function makeInstallment(Vehicle $vehicle, string $status): VehicleInstallment
    {
        return VehicleInstallment::create([
            'vehicle_id' => $vehicle->id,
            'origin' => 'manual',
            'amount_current' => '50.000000',
            'due_date' => now()->toDateString(),
            'description' => 'Feature test',
            'status' => $status,
        ]);
    }

    private function importFixture(int $vehicleId): array
    {
        return [
            'vehicles' => [[
                'autolocVehicleId' => 990001,
                'vehicleName' => 'Voiture source test',
                'autolocPlate' => 'TEST-1',
                'matchStatus' => 'matched',
                'matchedCandidates' => [['id' => $vehicleId]],
                'rawVehicleListCells' => ['', 'Voiture source test', 'TEST-1'],
                'rawSummaryCells' => ['', 'Voiture source test', 'TEST-1', 'SOFAC', '75.25', '2', '2', '0', '150.5', '150.5', '0'],
                'calculatedVsRecorded' => ['totalAmount' => 0, 'paidMonths' => 0, 'remainingMonths' => 0, 'paidAmount' => 0],
                'payments' => [
                    ['ordinal' => 1, 'amountText' => '75.25', 'amount' => 75.25, 'date' => '2025-01-05', 'description' => 'Première', 'sourceCells' => ['', '75.25', '2025-01-05', 'Première']],
                    ['ordinal' => 2, 'amountText' => '75.25', 'amount' => 75.25, 'date' => '2025-02-05', 'description' => 'Deuxième', 'sourceCells' => ['', '75.25', '2025-02-05', 'Deuxième']],
                ],
            ]],
        ];
    }
}
