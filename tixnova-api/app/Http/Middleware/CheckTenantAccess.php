<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantAccess
{
    /**
     * Ensure promotor can only access data within their own tenant.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        // Super admin bypasses tenant check
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Promotor must have a tenant
        if ($user->isPromotor() && ! $user->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not associated with any tenant.',
            ], 403);
        }

        // Promotor's tenant must be active
        if ($user->isPromotor() && $user->tenant) {
            if (! $user->tenant->isActive()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your tenant account is not active. Status: '.$user->tenant->status,
                ], 403);
            }
        }

        return $next($request);
    }
}
