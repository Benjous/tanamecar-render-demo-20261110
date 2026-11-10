<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SecurityController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Settings/Security', [
            'enabled' => (bool) $user->two_factor_confirmed_at,
            'pending' => (bool) $user->two_factor_secret && ! $user->two_factor_confirmed_at,
            'secret' => $user->two_factor_confirmed_at ? null : $user->two_factor_secret,
            'otpauth' => $user->two_factor_secret && ! $user->two_factor_confirmed_at
                ? app(TwoFactorService::class)->otpauthUrl('TanameCar', $user->email, $user->two_factor_secret)
                : null,
            'recovery_codes' => $request->session()->get('recovery_codes', []),
        ]);
    }

    public function enable(Request $request, TwoFactorService $twoFactor, AuditService $audit)
    {
        $user = $request->user();
        if ($user->two_factor_confirmed_at) {
            return back()->with('error', 'La double authentification est déjà active.');
        }

        $user->forceFill([
            'two_factor_secret' => $twoFactor->generateSecret(),
            'two_factor_confirmed_at' => null,
        ])->save();
        $audit->log('2fa_enable_requested', 'users', $user->id);

        return redirect()->route('settings.security')->with('success', 'Scannez ou saisissez le secret, puis confirmez avec un code.');
    }

    public function confirm(Request $request, TwoFactorService $twoFactor, AuditService $audit)
    {
        $request->validate(['code' => ['required', 'string', 'max:8']]);
        $user = $request->user();

        if (! $user->two_factor_secret || ! $twoFactor->verify($user->two_factor_secret, $request->input('code'))) {
            return back()->withErrors(['code' => 'Code invalide.']);
        }

        $codes = $twoFactor->generateRecoveryCodes();
        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $codes,
        ])->save();
        $audit->log('2fa_enabled', 'users', $user->id);

        return redirect()->route('settings.security')
            ->with('recovery_codes', $codes)
            ->with('success', 'Double authentification activée. Conservez les codes de récupération.');
    }

    public function disable(Request $request, AuditService $audit)
    {
        $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password)) {
            return back()->withErrors(['password' => 'Mot de passe incorrect.']);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
        $audit->log('2fa_disabled', 'users', $user->id);

        return back()->with('success', 'Double authentification désactivée.');
    }

    public function regenerateRecoveryCodes(Request $request, TwoFactorService $twoFactor, AuditService $audit)
    {
        $user = $request->user();
        if (! $user->two_factor_confirmed_at) {
            return back()->with('error', 'La double authentification n’est pas active.');
        }

        $codes = $twoFactor->generateRecoveryCodes();
        $user->forceFill(['two_factor_recovery_codes' => $codes])->save();
        $audit->log('2fa_recovery_regenerated', 'users', $user->id);

        return redirect()->route('settings.security')
            ->with('recovery_codes', $codes)
            ->with('success', 'Nouveaux codes de récupération générés.');
    }
}
