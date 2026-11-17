<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ProfileSwitchController extends Controller
{
    public function switch(Request $request, AuditService $audit): Response
    {
        $actor = $request->user();
        abort_unless($actor, 403);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $target = User::query()->where('active', true)->findOrFail($data['user_id']);

        if ($target->id === $actor->id) {
            return back()->with('success', 'Vous utilisez déjà ce profil.');
        }

        $audit->log('profile_switch_logout', 'users', $actor->id, null, [
            'from_id' => $actor->id,
            'from_email' => $actor->email,
            'target_id' => $target->id,
            'target_email' => $target->email,
        ]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login', ['email' => $target->email]);
    }
}
