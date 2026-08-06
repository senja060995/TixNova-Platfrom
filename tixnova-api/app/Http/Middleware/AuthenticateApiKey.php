<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next, string $scope = 'read'): Response
    {
        $key = $request->bearerToken() ?? $request->header('X-API-Key');

        if (! $key) {
            return response()->json([
                'success' => false,
                'message' => 'Missing API key.',
            ], 401);
        }

        $apiKey = ApiKey::withoutTenantScope()
            ->where('key_hash', hash('sha256', $key))
            ->first();

        if (! $apiKey || ! $apiKey->isUsable()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or inactive API key.',
            ], 401);
        }

        if (! $apiKey->hasScope($scope)) {
            return response()->json([
                'success' => false,
                'message' => "API key tidak memiliki scope '{$scope}'.",
            ], 403);
        }

        $apiKey->update(['last_used_at' => now()]);
        $request->attributes->set('api_key', $apiKey);
        $request->attributes->set('api_tenant', $apiKey->tenant);

        return $next($request);
    }
}
