<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DistributionLinkController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->referrals->distributionLinks($request->user())
                ->map(fn ($link) => [
                    'id' => $link->id,
                    'label' => $link->label,
                    'code' => $link->code,
                    'url' => $this->linkUrl($link),
                    'source' => $link->source,
                    'is_active' => $link->is_active,
                    'clicks' => $link->clicks,
                    'created_at' => $link->created_at?->toIso8601String(),
                ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:40'],
        ]);

        $link = $this->referrals->createDistributionLink(
            $request->user(),
            $validated['label'],
            $validated['source'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $link->id,
                'label' => $link->label,
                'code' => $link->code,
                'url' => $this->linkUrl($link),
                'source' => $link->source,
                'clicks' => 0,
            ],
        ], 201);
    }

    public function destroy(Request $request, int $link): JsonResponse
    {
        $this->referrals->deactivateDistributionLink($request->user(), $link);

        return response()->json(['success' => true]);
    }

    private function linkUrl($link): string
    {
        return url('/r/'.$link->code);
    }
}
