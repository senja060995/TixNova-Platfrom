<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(): JsonResponse
    {
        $campaigns = Campaign::withCount('vouchers')
            ->withSum('vouchers', 'used_count')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $campaigns->map(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'description' => $campaign->description,
                'status' => $campaign->status,
                'budget' => (float) $campaign->budget,
                'valid_from' => $campaign->valid_from?->toIso8601String(),
                'valid_until' => $campaign->valid_until?->toIso8601String(),
                'vouchers_count' => $campaign->vouchers_count,
                'voucher_used_total' => (int) $campaign->vouchers_sum_used_count,
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);

        $campaign = Campaign::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kampanye berhasil dibuat.',
            'data' => $campaign,
        ], 201);
    }

    public function show(Campaign $campaign): JsonResponse
    {
        $campaign->load('vouchers.event:id,title');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'description' => $campaign->description,
                'status' => $campaign->status,
                'budget' => (float) $campaign->budget,
                'valid_from' => $campaign->valid_from?->toIso8601String(),
                'valid_until' => $campaign->valid_until?->toIso8601String(),
                'vouchers' => $campaign->vouchers->map(fn (Voucher $voucher) => [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'discount_type' => $voucher->discount_type,
                    'discount_value' => (float) $voucher->discount_value,
                    'event_title' => $voucher->event?->title,
                    'used_count' => $voucher->used_count,
                    'max_use' => $voucher->max_use,
                    'is_active' => $voucher->is_active,
                ]),
            ],
        ]);
    }

    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        $campaign->update($this->validated($request));

        return response()->json([
            'success' => true,
            'message' => 'Kampanye berhasil diperbarui.',
            'data' => $campaign,
        ]);
    }

    public function activate(Campaign $campaign): JsonResponse
    {
        $campaign->update(['status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'Kampanye diaktifkan. Voucher terkait langsung berlaku.',
            'data' => $campaign,
        ]);
    }

    public function end(Campaign $campaign): JsonResponse
    {
        $campaign->update(['status' => 'ended']);

        return response()->json([
            'success' => true,
            'message' => 'Kampanye diakhiri. Voucher terkait tidak berlaku lagi.',
            'data' => $campaign,
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:draft,active,ended'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
        ]);
    }
}
