<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProfileSwitchTest extends TestCase
{
    use DatabaseTransactions;

    public function test_remember_me_sets_a_remember_token(): void
    {
        $user = User::create([
            'name' => 'Remember User',
            'email' => 'remember-'.uniqid().'@example.test',
            'password' => 'Remember!2026',
            'is_admin' => false,
            'active' => true,
            'organization_id' => 1,
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'Remember!2026',
            'remember' => true,
        ])->assertRedirect('/contracts?view=returns');

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_switch_profile_closes_session_and_redirects_to_target_login(): void
    {
        [$admin, $target] = $this->users();

        $this->actingAs($admin)->post('/profile/switch', [
            'user_id' => $target->id,
        ])->assertRedirect(route('login', ['email' => $target->email]));

        $this->assertGuest();
        $this->get('/reports')->assertRedirect('/login');
        $this->assertDatabaseHas('activity_log', [
            'user_id' => $admin->id,
            'action' => 'profile_switch_logout',
            'entity_type' => 'users',
            'entity_id' => $admin->id,
        ]);
    }

    public function test_switch_profile_does_not_grant_target_rights_without_password(): void
    {
        [$admin, $target] = $this->users();

        $this->actingAs($admin)->post('/profile/switch', [
            'user_id' => $target->id,
        ])->assertRedirect(route('login', ['email' => $target->email]));

        $this->assertGuest();
        $this->get('/reports')->assertRedirect('/login');
    }

    public function test_non_admin_can_switch_only_through_target_login(): void
    {
        [$admin, $target] = $this->users();

        $this->actingAs($target)->post('/profile/switch', [
            'user_id' => $admin->id,
        ])->assertRedirect(route('login', ['email' => $admin->email]));

        $this->assertGuest();
        $this->assertDatabaseHas('activity_log', [
            'user_id' => $target->id,
            'action' => 'profile_switch_logout',
            'entity_type' => 'users',
            'entity_id' => $target->id,
        ]);
    }

    public function test_activity_log_is_admin_only(): void
    {
        [$admin, $target] = $this->users();

        $this->actingAs($target)->get('/reports')->assertForbidden();
        $this->actingAs($admin)->get('/reports')->assertOk();
    }

    public function test_admin_can_filter_activity_log_by_user_and_module(): void
    {
        [$admin, $target] = $this->users();

        DB::table('activity_log')->insert([
            ['user_id' => $admin->id, 'action' => 'create', 'entity_type' => 'clients', 'entity_id' => 1000003, 'created_at' => now()],
            ['user_id' => $target->id, 'action' => 'update', 'entity_type' => 'clients', 'entity_id' => 1000004, 'created_at' => now()],
            ['user_id' => $target->id, 'action' => 'create', 'entity_type' => 'contracts', 'entity_id' => 1000005, 'created_at' => now()],
        ]);

        $page = $this->actingAs($admin)
            ->get('/reports?user_id='.$target->id.'&module=clients')
            ->viewData('page');

        $rows = collect($page['props']['rows']);

        $this->assertTrue($page['props']['canViewAll']);
        $this->assertTrue($rows->every(fn ($row) => (int) $row->user_id === $target->id));
        $this->assertTrue($rows->every(fn ($row) => $row->entity_type === 'clients'));
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function users(): array
    {
        $roleId = Role::query()->where('name', 'Gestion de contrat')->value('id');

        $admin = User::create([
            'name' => 'Admin Switch',
            'email' => 'admin-switch-'.uniqid().'@example.test',
            'password' => 'AdminPass!2026',
            'is_admin' => true,
            'active' => true,
            'organization_id' => 1,
        ]);

        $target = User::create([
            'name' => 'Target Switch',
            'email' => 'target-switch-'.uniqid().'@example.test',
            'password' => 'TargetPass!2026',
            'is_admin' => false,
            'active' => true,
            'role_id' => $roleId,
            'organization_id' => 1,
        ]);

        return [$admin, $target];
    }
}
