<?php

namespace App\Http\Middleware;

use App\Models\AppNotification;
use App\Models\User;
use App\Models\WadiSyncRun;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $user?->loadMissing('role');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => (bool) $user->is_admin,
                    'role' => $user->role?->name,
                    'permissions' => $user->role?->permissions ?? [],
                ] : null,
            ],
            'profiles' => $user ? [
                'current' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => (bool) $user->is_admin,
                    'role' => $user->role?->name,
                ],
                'available' => User::query()
                    ->where('active', true)
                    ->with('role')
                    ->orderBy('name')
                    ->get()
                    ->map(fn (User $profile) => [
                        'id' => $profile->id,
                        'name' => $profile->name,
                        'email' => $profile->email,
                        'is_admin' => (bool) $profile->is_admin,
                        'role' => $profile->role?->name,
                    ])
                    ->values()
                    ->all(),
                'impersonation' => null,
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => [
                'unread' => $user ? AppNotification::where('user_id', $user->id)->whereNull('read_at')->count() : 0,
            ],
            'wadi_sync' => $user ? [
                'last_success_at' => WadiSyncRun::query()->where('status', 'success')->latest('finished_at')->value('finished_at'),
                'last_status' => WadiSyncRun::query()->latest('id')->value('status'),
            ] : null,
            'company' => [
                'name' => 'TanameCar',
                'currency' => 'MAD',
                'timezone' => 'Africa/Casablanca',
            ],
            'branding' => [
                'name' => config('branding.name'),
                'logo' => config('branding.logo'),
                'primary' => config('branding.primary'),
                'blue' => config('branding.blue'),
                'accent' => config('branding.accent'),
                'footer' => config('branding.footer'),
            ],
        ];
    }
}
