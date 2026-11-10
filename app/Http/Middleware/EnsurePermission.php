<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $resource, string $action = 'view'): Response
    {
        $user = $request->user();
        if (! $user || ! $user->canDo($resource, $action)) {
            abort(403, 'Action non autorisée.');
        }

        return $next($request);
    }
}
