<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        return Inertia::render('Settings/Profile', ['user' => $request->user()]);
    }

    public function update(Request $request, AuditService $audit)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', Password::min(10)->mixedCase()->numbers()],
            'password_confirmation' => ['nullable', 'same:password'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }
        unset($data['password_confirmation']);

        $before = $user->only(['name', 'email']);
        $user->update($data);
        $audit->log('update', 'users', $user->id, $before, $user->only(['name', 'email']));

        return back()->with('success', 'Profil mis à jour.');
    }
}
