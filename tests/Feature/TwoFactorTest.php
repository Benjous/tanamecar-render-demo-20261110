<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Str;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use DatabaseTransactions;

    public function test_two_factor_enable_challenge_and_disable(): void
    {
        $user = User::create([
            'name' => '2FA User',
            'email' => 'twofactor-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $this->actingAs($user)->post('/settings/security/enable')->assertRedirect('/settings/security');
        $secret = $user->fresh()->two_factor_secret;
        $this->assertNotEmpty($secret);

        $code = app(TwoFactorService::class)->code($secret);
        $this->actingAs($user)->post('/settings/security/confirm', ['code' => $code])->assertRedirect('/settings/security');
        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
        $this->assertCount(8, $user->fresh()->two_factor_recovery_codes);

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'Password123!'])
            ->assertRedirect('/two-factor-challenge');
        $this->get('/two-factor-challenge')->assertOk();

        $freshCode = app(TwoFactorService::class)->code($user->fresh()->two_factor_secret);
        $this->post('/two-factor-challenge', ['code' => $freshCode])->assertRedirect('/clients');
        $this->assertAuthenticatedAs($user);

        $this->post('/settings/security/disable', ['password' => 'Password123!'])->assertRedirect();
        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_two_factor_recovery_code_is_single_use(): void
    {
        $user = User::create([
            'name' => '2FA Recovery User',
            'email' => 'twofactor-recovery-'.Str::random(6).'@example.test',
            'password' => 'Password123!',
            'is_admin' => true,
            'active' => true,
        ]);

        $this->actingAs($user)->post('/settings/security/enable');
        $secret = $user->fresh()->two_factor_secret;
        $this->actingAs($user)->post('/settings/security/confirm', ['code' => app(TwoFactorService::class)->code($secret)]);
        $recoveryCode = $user->fresh()->two_factor_recovery_codes[0];

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'Password123!'])
            ->assertRedirect('/two-factor-challenge');
        $this->post('/two-factor-challenge', ['code' => $recoveryCode])->assertRedirect('/clients');
        $this->assertAuthenticatedAs($user);
        $this->assertNotContains($recoveryCode, $user->fresh()->two_factor_recovery_codes);
        $this->assertCount(7, $user->fresh()->two_factor_recovery_codes);

        $this->post('/logout');
        $this->post('/login', ['email' => $user->email, 'password' => 'Password123!'])
            ->assertRedirect('/two-factor-challenge');
        $this->post('/two-factor-challenge', ['code' => $recoveryCode])->assertSessionHasErrors('code');
    }
}
