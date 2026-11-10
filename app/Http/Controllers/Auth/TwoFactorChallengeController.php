<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TwoFactorChallengeController extends Controller
{
    public function create(Request $request)
    {
        abort_unless($request->session()->has('two_factor_user_id'), 403);

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    public function store(Request $request, TwoFactorService $twoFactor, AuditService $audit)
    {
        $request->validate(['code' => ['required', 'string', 'max:32']]);

        $userId = $request->session()->get('two_factor_user_id');
        abort_unless($userId, 403);

        $key = '2fa:'.$userId.'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'code' => 'Trop de tentatives. Réessayez dans '.RateLimiter::availableIn($key).' secondes.',
            ]);
        }

        $user = User::findOrFail($userId);
        $code = trim((string) $request->input('code'));

        $valid = $user->two_factor_secret
            && ($twoFactor->verify($user->two_factor_secret, $code)
                || $twoFactor->verifyRecoveryCode($user, $code));

        if (! $valid) {
            RateLimiter::hit($key, 300);
            throw ValidationException::withMessages(['code' => 'Code invalide.']);
        }

        RateLimiter::clear($key);
        Auth::login($user, (bool) $request->session()->pull('two_factor_remember', false));
        $request->session()->forget('two_factor_user_id');
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        $audit->log('login_2fa', 'users', $user->id);

        return redirect()->intended(route('dashboard'));
    }
}
