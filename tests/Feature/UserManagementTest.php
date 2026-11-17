<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_create_a_second_admin_who_can_login(): void
    {
        $admin = User::create([
            'name' => 'Owner Admin',
            'email' => 'owner-admin-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $email = 'new-admin-'.Str::random(6).'@example.test';
        $response = $this->actingAs($admin)->post('/settings/users', [
            'name' => 'Second Admin',
            'email' => $email,
            'password' => 'SecondAdmin!2026',
            'password_confirmation' => 'SecondAdmin!2026',
            'is_admin' => true,
            'active' => true,
        ]);

        $response->assertRedirect('/settings/users');
        $this->assertDatabaseHas('users', ['email' => $email, 'is_admin' => true]);
        $this->assertDatabaseHas('activity_log', ['action' => 'create', 'entity_type' => 'users']);

        $this->post('/logout');
        $this->post('/login', ['email' => $email, 'password' => 'SecondAdmin!2026'])->assertRedirect('/contracts?view=returns');
        $this->get('/dashboard')->assertOk();
        $this->get('/clients')->assertOk();
    }

    public function test_non_admin_cannot_create_a_user_and_email_must_be_unique(): void
    {
        $admin = User::create([
            'name' => 'Admin Unique',
            'email' => 'admin-unique-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);
        $user = User::create([
            'name' => 'Normal User',
            'email' => 'normal-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => false,
            'active' => true,
        ]);

        $this->actingAs($user)->post('/settings/users', [
            'name' => 'Forbidden',
            'email' => 'forbidden-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertForbidden();

        $this->actingAs($admin)->post('/settings/users', [
            'name' => 'Duplicate',
            'email' => $admin->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSessionHasErrors('email');
    }
}
