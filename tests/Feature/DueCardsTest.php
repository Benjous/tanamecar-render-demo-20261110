<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Contract;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class DueCardsTest extends TestCase
{
    use DatabaseTransactions;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_month_card_uses_casablanca_boundaries_and_matches_list_count(): void
    {
        $admin = User::create([
            'name' => 'Due Admin',
            'email' => 'due-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $client = Client::query()->firstOrFail();
        $vehicle = Vehicle::query()->firstOrFail();

        CarbonImmutable::setTestNow(CarbonImmutable::parse('2035-06-15 12:00:00', Contract::OPERATIONS_TIMEZONE));

        $this->makeContract($admin, $client, $vehicle, '2035-06-01 00:00:00', false);
        $this->makeContract($admin, $client, $vehicle, '2035-06-15 23:59:59', false);
        $this->makeContract($admin, $client, $vehicle, '2035-06-30 23:59:59', false);
        $this->makeContract($admin, $client, null, '2035-06-30 12:00:00', false);
        $this->makeContract($admin, $client, $vehicle, '2035-07-01 00:00:00', false);
        $this->makeContract($admin, $client, $vehicle, '2035-05-31 23:59:59', false);
        $this->makeContract($admin, $client, $vehicle, '2035-06-15 12:00:00', true);
        $this->makeContract($admin, $client, $vehicle, null, false);

        $response = $this->actingAs($admin)->get('/contracts?due=month');
        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertSame(4, $page['props']['counters']['due_month']);
        $this->assertCount(4, $page['props']['contracts']);
        $this->assertSame('month', $page['props']['filters']['due']);

        $overdue = $this->actingAs($admin)->get('/contracts?status=overdue');
        $overduePage = $overdue->viewData('page');
        $this->assertSame($overduePage['props']['counters']['overdue'], count($overduePage['props']['contracts']));
        $this->assertGreaterThanOrEqual(1, count($overduePage['props']['contracts']));

        $dashboard = $this->actingAs($admin)->get('/dashboard');
        $dashboardPage = $dashboard->viewData('page');
        $this->assertSame($dashboardPage['props']['counters']['available'], Vehicle::query()->available()->count());
    }

    public function test_vehicle_cards_and_dashboard_available_share_the_same_scope(): void
    {
        $admin = User::create([
            'name' => 'Vehicle Admin',
            'email' => 'vehicle-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $expected = [
            'sous_location' => Vehicle::query()->sousLocation()->count(),
            'available' => Vehicle::query()->available()->count(),
            'location' => Vehicle::query()->locationMode()->count(),
        ];

        $page = $this->actingAs($admin)->get('/vehicles')->viewData('page');
        $this->assertSame($expected, $page['props']['counters']);
        $this->assertCount($expected['sous_location'], $this->actingAs($admin)->get('/vehicles?mode=sous_location')->viewData('page')['props']['vehicles']);
        $this->assertCount($expected['available'], $this->actingAs($admin)->get('/vehicles?status=disponible')->viewData('page')['props']['vehicles']);
        $this->assertCount($expected['location'], $this->actingAs($admin)->get('/vehicles?mode=location')->viewData('page')['props']['vehicles']);

        $dashboard = $this->actingAs($admin)->get('/dashboard')->viewData('page');
        $this->assertSame($expected['available'], $dashboard['props']['counters']['available']);
    }

    private function makeContract(User $admin, Client $client, ?Vehicle $vehicle, ?string $returnAt, bool $returned): Contract
    {
        $return = $returnAt ? CarbonImmutable::parse($returnAt, Contract::OPERATIONS_TIMEZONE) : null;

        return Contract::create([
            'reference' => 'TEST-'.Str::upper(Str::random(10)),
            'client_id' => $client->id,
            'vehicle_id' => $vehicle?->id,
            'departure_at' => $return ? $return->subDay() : null,
            'return_at' => $return,
            'returned' => $returned,
            'total_amount' => 1000,
            'daily_rate' => 100,
            'days' => 10,
            'created_by' => $admin->id,
            'data_quality_status' => $vehicle ? 'complete' : 'incomplete_vehicle',
        ]);
    }
}
