<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Users', [
            'users' => User::with('role')->orderBy('name')->get(),
            'roles' => Role::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Settings/UserCreate', [
            'roles' => Role::orderBy('name')->get(['id', 'name']),
            'defaultRoleId' => Role::where('name', 'Administrateur')->value('id') ?? Role::orderBy('id')->value('id'),
        ]);
    }

    public function store(Request $request, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(10)->mixedCase()->numbers()],
            'password_confirmation' => ['nullable', 'same:password'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'is_admin' => ['boolean'],
            'active' => ['boolean'],
        ]);
        $data['organization_id'] = 1;
        $data['is_admin'] = $request->boolean('is_admin', true);
        $data['active'] = $request->boolean('active', true);
        $data['role_id'] = $data['role_id'] ?? (Role::where('name', 'Administrateur')->value('id') ?? 1);
        $data['confirmed_at'] = now();
        unset($data['password_confirmation']);
        $user = User::create($data);
        $audit->log('create', 'users', $user->id, null, ['email' => $user->email]);

        return redirect()->route('settings.users')->with('success', 'Utilisateur créé.');
    }

    public function update(Request $request, User $user, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'password' => ['nullable', Password::min(10)->mixedCase()->numbers()],
            'password_confirmation' => ['nullable', 'same:password'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'is_admin' => ['boolean'],
            'active' => ['boolean'],
        ]);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        unset($data['password_confirmation']);
        $before = $user->only(['name', 'email', 'role_id', 'is_admin', 'active']);
        $user->update($data);
        $audit->log('update', 'users', $user->id, $before, $user->only(['name', 'email', 'role_id', 'is_admin', 'active']));

        return back()->with('success', 'Utilisateur mis à jour.');
    }

    public function deactivate(User $user, AuditService $audit)
    {
        abort_if($user->id === auth()->id(), 422, 'Impossible de désactiver votre propre compte.');
        $user->update(['active' => false]);
        $audit->log('deactivate', 'users', $user->id);

        return back()->with('success', 'Utilisateur désactivé.');
    }
}
