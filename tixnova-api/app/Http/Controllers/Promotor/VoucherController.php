<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VoucherController extends Controller
{
    /**
     * GET /api/promotor/vouchers — List voucher milik tenant
     */
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::with('event:id,title')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $vouchers,
        ]);
    }

    /**
     * POST /api/promotor/vouchers — Buat voucher baru
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|unique:vouchers,code|max:50',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'required|numeric|min:0',
            'event_id' => 'nullable|exists:events,id',
            'campaign_id' => 'nullable|integer',
            'min_purchase' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'max_use' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        if ($request->campaign_id && ! Campaign::withoutTenantScope()->whereKey($request->campaign_id)->where('tenant_id', $request->user()->tenant_id)->exists()) {
            abort(422, 'Kampanye tidak valid.');
        }

        $voucher = Voucher::create([
            'code' => Str::upper($request->code),
            'event_id' => $request->event_id,
            'campaign_id' => $request->campaign_id,
            'type' => $request->event_id ? 'event' : 'global',
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'min_purchase' => $request->min_purchase ?? 0,
            'max_discount' => $request->max_discount,
            'max_use' => $request->max_use,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Voucher berhasil dibuat.',
            'data' => $voucher,
        ], 201);
    }

    /**
     * DELETE /api/promotor/vouchers/{id} — Hapus voucher
     */
    public function destroy(int $id): JsonResponse
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Voucher berhasil dihapus.',
        ]);
    }
}
