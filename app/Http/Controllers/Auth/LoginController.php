<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request, AuditService $audit)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $key = 'login:'.strtolower($credentials['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Trop de tentatives. Réessayez dans '.RateLimiter::availableIn($key).' secondes.',
            ]);
        }

        try {
            $valid = Auth::validate($credentials);
        } catch (\RuntimeException $exception) {
            RateLimiter::hit($key, 900);
            Log::warning('login.hash_incompatible', [
                'email_hash' => hash('sha256', strtolower($credentials['email'])),
                'exception' => $exception::class,
            ]);
            $valid = false;
        }

        if (! $valid) {
            RateLimiter::hit($key, 900);
            throw ValidationException::withMessages([
                'email' => 'Identifiants invalides.',
            ]);
        }

        RateLimiter::clear($key);
        $user = User::where('email', $credentials['email'])->firstOrFail();

        if (! $user->active) {
            throw ValidationException::withMessages(['email' => 'Compte désactivé.']);
        }

        $request->session()->regenerate();
        $remember = $request->boolean('remember') || strtolower($credentials['email']) === 'demo@tanamecar.test';

        if ($user->two_factor_confirmed_at) {
            $request->session()->put('two_factor_user_id', $user->id);
            $request->session()->put('two_factor_remember', $remember);

            return redirect()->route('two-factor.challenge');
        }

        Auth::login($user, $remember);
        $user->forceFill(['last_login_at' => now()])->save();
        $audit->log('login', 'users', $user->id);

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request, AuditService $audit)
    {
        $audit->log('logout', 'users', $request->user()?->id);
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
