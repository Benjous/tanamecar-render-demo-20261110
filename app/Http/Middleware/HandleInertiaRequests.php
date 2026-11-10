<?php

namespace App\Http\Middleware;

use App\Models\AppNotification;
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
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => [
                'unread' => $user ? AppNotification::where('user_id', $user->id)->whereNull('read_at')->count() : 0,
            ],
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
