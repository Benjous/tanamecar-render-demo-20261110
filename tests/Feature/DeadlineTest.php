<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleDeadline;
use App\Services\DeadlineService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeadlineTest extends TestCase
{
    use DatabaseTransactions;

    private function admin(): User
    {
        return User::create([
            'name' => 'Deadline Admin',
            'email' => 'deadline-'.Str::random(8).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
    }

    public function test_statuses_orange_red_green_and_counts(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $today = CarbonImmutable::now('Africa/Casablanca')->startOfDay();

        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Proche date', 'due_date' => $today->addDays(5)->toDateString(), 'created_by' => $admin->id]);
        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Dépassée date', 'due_date' => $today->subDays(2)->toDateString(), 'created_by' => $admin->id]);
        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Lointaine', 'due_date' => $today->addDays(90)->toDateString(), 'created_by' => $admin->id]);
        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Proche km', 'due_km' => (float) $vehicle->km + 100, 'created_by' => $admin->id]);
        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Dépassée km', 'due_km' => (float) $vehicle->km - 100, 'created_by' => $admin->id]);
        $done = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Traitée', 'due_date' => $today->subDays(10)->toDateString(), 'completed_at' => now(), 'completed_by' => $admin->id, 'created_by' => $admin->id]);

        $service = app(DeadlineService::class);
        $this->assertSame('soon', $service->status(VehicleDeadline::where('title', 'Proche date')->first())['code']);
        $this->assertSame('overdue', $service->status(VehicleDeadline::where('title', 'Dépassée date')->first())['code']);
        $this->assertSame('up_to_date', $service->status(VehicleDeadline::where('title', 'Lointaine')->first())['code']);
        $this->assertSame('soon', $service->status(VehicleDeadline::where('title', 'Proche km')->first())['code']);
        $this->assertSame('overdue', $service->status(VehicleDeadline::where('title', 'Dépassée km')->first())['code']);
        $this->assertSame('done', $service->status($done)['code']);

        $counts = $service->counts();
        $this->assertGreaterThanOrEqual(2, $counts['soon']);
        $this->assertGreaterThanOrEqual(2, $counts['overdue']);
        $this->assertGreaterThanOrEqual(1, $counts['up_to_date']);
        $this->assertGreaterThanOrEqual(1, $counts['done']);
    }

    public function test_completion_keeps_history_and_creates_next_deadline(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create([
            'vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Vidange test',
            'due_date' => CarbonImmutable::now()->subDays(3)->toDateString(), 'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)->post("/deadlines/{$deadline->id}/complete", [
            'completed_at' => now()->toDateString(),
            'note' => 'Réalisée',
            'next_due_date' => CarbonImmutable::now()->addMonths(6)->toDateString(),
        ])->assertRedirect();

        $deadline->refresh();
        $this->assertNotNull($deadline->completed_at);
        $this->assertSame($admin->id, $deadline->completed_by);
        $this->assertSame('Réalisée', $deadline->completion_note);
        $this->assertDatabaseHas('vehicle_deadlines', [
            'vehicle_id' => $vehicle->id,
            'title' => 'Vidange test',
            'completed_at' => null,
            'due_date' => CarbonImmutable::now()->addMonths(6)->toDateString(),
        ]);
        $this->assertDatabaseHas('activity_log', ['entity_type' => 'vehicle_deadlines', 'entity_id' => $deadline->id, 'action' => 'complete']);
    }

    public function test_unauthorized_user_cannot_complete(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Permission', 'due_date' => now()->toDateString(), 'created_by' => $admin->id]);
        $user = User::create(['name' => 'Sans droit', 'email' => 'no-'.Str::random(8).'@example.test', 'password' => 'Password123!', 'is_admin' => false, 'active' => true]);

        $this->actingAs($user)->post("/deadlines/{$deadline->id}/complete", ['completed_at' => now()->toDateString()])->assertForbidden();
        $this->assertNull($deadline->fresh()->completed_at);
    }

    public function test_already_completed_cannot_be_completed_twice(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Double', 'due_date' => now()->toDateString(), 'completed_at' => now(), 'completed_by' => $admin->id, 'created_by' => $admin->id]);

        $this->actingAs($admin)->post("/deadlines/{$deadline->id}/complete", ['completed_at' => now()->toDateString()])->assertStatus(422);
    }

    public function test_page_recap_and_validation(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Page test', 'due_date' => now()->addDays(3)->toDateString(), 'created_by' => $admin->id]);

        $this->actingAs($admin)->get('/deadlines')->assertOk();
        $recap = $this->actingAs($admin)->getJson('/recap');
        $recap->assertOk();
        $recap->assertJsonPath('deadlines.counts.soon', fn ($value) => $value >= 1);
        $this->assertDatabaseHas('vehicle_deadlines', ['id' => $deadline->id]);

        $this->actingAs($admin)->post('/deadlines', ['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Sans échéance'])->assertStatus(422);
    }
    public function test_far_future_is_not_in_recap_items(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Très lointaine', 'due_date' => now()->addDays(120)->toDateString(), 'created_by' => $admin->id]);
        $items = app(DeadlineService::class)->recap(100)['items'];
        $this->assertFalse(collect($items)->contains(fn ($item) => $item['id'] === $deadline->id));
    }

    public function test_completion_updates_recap_counts(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $deadline = VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Compteur test', 'due_date' => now()->addDays(2)->toDateString(), 'created_by' => $admin->id]);
        $before = app(DeadlineService::class)->counts();
        $this->actingAs($admin)->post("/deadlines/{$deadline->id}/complete", ['completed_at' => now()->toDateString()])->assertRedirect();
        $after = app(DeadlineService::class)->counts();
        $this->assertSame($before['soon'] - 1, $after['soon']);
        $this->assertSame($before['done'] + 1, $after['done']);
    }

    public function test_new_deadline_can_be_created_with_date(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        $this->actingAs($admin)->post('/deadlines', ['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Créée test', 'due_date' => now()->addDays(20)->toDateString()])->assertRedirect();
        $this->assertDatabaseHas('vehicle_deadlines', ['title' => 'Créée test', 'vehicle_id' => $vehicle->id]);
    }

    public function test_vehicle_show_exposes_deadlines(): void
    {
        $admin = $this->admin();
        $vehicle = Vehicle::query()->firstOrFail();
        $type = DB::table('maintenance_types')->first();
        VehicleDeadline::create(['vehicle_id' => $vehicle->id, 'maintenance_type_id' => $type->id, 'title' => 'Fiche test', 'due_date' => now()->addDays(4)->toDateString(), 'created_by' => $admin->id]);
        $this->actingAs($admin)->get("/vehicles/{$vehicle->id}")->assertOk()->assertInertia(fn ($page) => $page->has('deadlines'));
    }

}
