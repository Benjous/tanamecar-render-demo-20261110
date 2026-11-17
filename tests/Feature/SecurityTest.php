<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use DatabaseTransactions;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
        $this->get('/contracts')->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_settings_but_can_use_business_modules(): void
    {
        $role = Role::find(106) ?? Role::create([
            'id' => 106,
            'name' => 'Gestion de contrat',
            'permissions' => ['entity_slv_contrats_view' => 'yes'],
        ]);
        $user = User::create([
            'name' => 'Test Secretary',
            'email' => 'test-secretary-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'role_id' => $role->id,
            'is_admin' => false,
            'active' => true,
        ]);

        $this->actingAs($user)->get('/settings/users')->assertForbidden();
        $this->actingAs($user)->get('/payments')->assertOk();
    }

    public function test_admin_can_access_settings(): void
    {
        $admin = User::create([
            'name' => 'Test Admin',
            'email' => 'test-admin-sec-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $this->actingAs($admin)->get('/settings/users')->assertOk();
        $this->actingAs($admin)->get('/settings/company')->assertOk();
    }
}
