<?php

namespace App\Http\Middleware;

use App\Models\OfflineOperation;
use Carbon\Carbon;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class HandleOfflineOperations
{
    public function handle(Request $request, Closure $next): Response
    {
        $operationId = (string) $request->header('X-Offline-Operation-Id', '');
        if ($operationId === '' || ! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        abort_unless($request->user(), 403);
        abort_unless(preg_match('/^[A-Za-z0-9-]{16,100}$/', $operationId) === 1, 422, 'Identifiant hors ligne invalide.');

        $existing = OfflineOperation::query()
            ->where('operation_id', $operationId)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return $this->replay($existing);
        }

        $expectedVersion = (string) $request->header('X-Offline-Expected-Version', '');
        if ($expectedVersion !== '') {
            $conflict = $this->versionConflict($request, $expectedVersion);
            if ($conflict !== null) {
                OfflineOperation::create([
                    'operation_id' => $operationId,
                    'user_id' => $request->user()->id,
                    'method' => $request->method(),
                    'url' => $request->fullUrl(),
                    'payload' => $this->payload($request),
                    'status' => 'conflict',
                    'response_status' => 409,
                    'response_headers' => ['Content-Type' => 'application/json'],
                    'response_body' => json_encode($conflict, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'server_data' => $conflict,
                    'error' => 'Version serveur plus récente.',
                ]);

                return response()->json($conflict, 409);
            }
        }

        $operation = OfflineOperation::create([
            'operation_id' => $operationId,
            'user_id' => $request->user()->id,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'payload' => $this->payload($request),
            'status' => 'pending',
        ]);

        try {
            $response = $next($request);
        } catch (Throwable $exception) {
            $operation->update(['status' => 'error', 'error' => mb_substr($exception->getMessage(), 0, 1000)]);

            throw $exception;
        }

        $status = $response->getStatusCode();
        $operationStatus = $status >= 200 && $status < 400 ? 'completed' : ($status === 409 ? 'conflict' : 'error');
        $headers = $this->safeHeaders($response);

        $operation->update([
            'status' => $operationStatus,
            'response_status' => $status,
            'response_headers' => $headers,
            'response_body' => $response->getContent(),
            'error' => $operationStatus === 'error' ? 'Réponse serveur '.$status : null,
        ]);

        return $response;
    }

    private function replay(OfflineOperation $operation): Response
    {
        if ($operation->status === 'pending') {
            return response()->json(['message' => 'Opération hors ligne en cours de traitement.'], 409);
        }

        $status = (int) ($operation->response_status ?? 409);
        $headers = is_array($operation->response_headers) ? $operation->response_headers : [];

        return response($operation->response_body ?? '', $status, $headers);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function versionConflict(Request $request, string $expected): ?array
    {
        try {
            $expectedAt = Carbon::parse($expected);
        } catch (Throwable) {
            return null;
        }

        foreach (($request->route()?->parameters() ?? []) as $parameter) {
            if (! $parameter instanceof Model || ! isset($parameter->updated_at)) {
                continue;
            }

            if (! $expectedAt->equalTo($parameter->updated_at)) {
                return [
                    'message' => 'Conflit : une version plus récente existe sur le serveur.',
                    'resource' => class_basename($parameter),
                    'id' => $parameter->getKey(),
                    'server_updated_at' => $parameter->updated_at?->toIso8601String(),
                    'server' => $parameter->toArray(),
                ];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        return $request->except([
            'password',
            'password_confirmation',
            'current_password',
            '_token',
            '_method',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function safeHeaders(Response $response): array
    {
        return collect($response->headers->all())
            ->only(['location', 'x-inertia-location', 'content-type', 'x-inertia'])
            ->map(fn (array $values): string => (string) ($values[0] ?? ''))
            ->all();
    }
}
