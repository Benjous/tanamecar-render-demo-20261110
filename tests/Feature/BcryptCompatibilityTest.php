<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class BcryptCompatibilityTest extends TestCase
{
    use DatabaseTransactions;

    private function hashWithPrefix(string $prefix): string
    {
        return $prefix.substr(Hash::make('TestBcrypt2b!2026'), 4);
    }

    public function test_bcrypt_2a_2b_and_2y_hashes_are_verified(): void
    {
        foreach (['$2a$', '$2b$', '$2y$'] as $prefix) {
            $hash = $this->hashWithPrefix($prefix);
            $this->assertTrue(Hash::check('TestBcrypt2b!2026', $hash), $prefix);
            $this->assertFalse(Hash::check('wrong-password', $hash), $prefix);
        }
    }

    public function test_bcrypt_2x_hash_is_rejected(): void
    {
        $this->expectException(RuntimeException::class);
        Hash::check('TestBcrypt2b!2026', $this->hashWithPrefix('$2x$'));
    }

    public function test_user_model_hashes_plain_password_once(): void
    {
        $user = User::create([
            'name' => 'Hash Test',
            'email' => 'hash-'.Str::random(8).'@example.test',
            'password' => 'PlainPassword!2026',
            'is_admin' => false,
            'active' => true,
        ]);
        $this->assertTrue(Hash::check('PlainPassword!2026', $user->password));
    }

    public function test_bcrypt_2b_user_can_login(): void
    {
        $email = 'bcrypt2b-'.Str::random(8).'@example.test';
        DB::table('users')->insert([
            'name' => 'Bcrypt 2b',
            'email' => $email,
            'password' => $this->hashWithPrefix('$2b$'),
            'is_admin' => true,
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->post('/login', ['email' => $email, 'password' => 'TestBcrypt2b!2026'])->assertRedirect('/contracts?view=returns');
        $this->assertAuthenticated();
    }

    public function test_malformed_hash_returns_validation_error_not_500(): void
    {
        $email = 'malformed-'.Str::random(8).'@example.test';
        DB::table('users')->insert([
            'name' => 'Malformed',
            'email' => $email,
            'password' => 'not-a-valid-hash',
            'is_admin' => false,
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $response = $this->from('/login')->post('/login', ['email' => $email, 'password' => 'anything']);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_bcrypt_2x_user_cannot_login_and_gets_generic_error(): void
    {
        $email = 'bcrypt2x-'.Str::random(8).'@example.test';
        DB::table('users')->insert([
            'name' => 'Bcrypt 2x',
            'email' => $email,
            'password' => $this->hashWithPrefix('$2x$'),
            'is_admin' => false,
            'active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $response = $this->from('/login')->post('/login', ['email' => $email, 'password' => 'TestBcrypt2b!2026']);
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
