<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class CommissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'default_commission' => config('commission.default'),
                'tiers' => config('commission.tiers'),
                'minimum_amount' => config('commission.minimum_amount'),
                'maximum_amount' => config('commission.maximum_amount'),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'default_commission' => 'nullable|numeric|min:0|max:100',
            'tiers' => 'nullable|array',
            'tiers.*' => 'numeric|min:0|max:100',
            'minimum_amount' => 'nullable|integer|min:0',
            'maximum_amount' => 'nullable|integer|min:0',
        ]);

        // Update config at runtime (note: this won't persist across requests without writing to .env)
        if (isset($validated['default_commission'])) {
            Config::set('commission.default', $validated['default_commission']);
        }

        if (isset($validated['tiers'])) {
            Config::set('commission.tiers', $validated['tiers']);
        }

        if (isset($validated['minimum_amount'])) {
            Config::set('commission.minimum_amount', $validated['minimum_amount']);
        }

        if (isset($validated['maximum_amount'])) {
            Config::set('commission.maximum_amount', $validated['maximum_amount']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commission settings updated (runtime only - update .env for persistence)',
            'data' => [
                'default_commission' => config('commission.default'),
                'tiers' => config('commission.tiers'),
                'minimum_amount' => config('commission.minimum_amount'),
                'maximum_amount' => config('commission.maximum_amount'),
            ],
        ]);
    }
}
