<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Roles', [
            'roles' => Role::withCount('users')->orderBy('name')->get(),
        ]);
    }

    public function edit(Role $role)
    {
        return Inertia::render('Settings/RoleForm', ['role' => $role]);
    }

    public function update(Request $request, Role $role, AuditService $audit)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'permissions' => ['nullable', 'array'],
        ]);
        $before = $role->toArray();
        $role->update($data);
        $audit->log('update', 'roles', $role->id, $before, $role->fresh()->toArray());

        return redirect()->route('settings.roles')->with('success', 'Rôle mis à jour.');
    }
}
