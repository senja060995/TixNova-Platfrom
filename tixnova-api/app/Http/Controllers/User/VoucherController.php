<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * POST /api/vouchers/apply — Cek & Terapkan Kode Voucher
     */
    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'code'     => 'required|string',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $voucher = Voucher::where('code', strtoupper(trim($request->code)))->first();

        if (! $voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Kode voucher tidak valid atau tidak ditemukan.',
            ], 404);
        }

        if (! $voucher->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher sudah kedaluwarsa atau kuota penggunaan telah habis.',
            ], 422);
        }

        $subtotal = (float) $request->subtotal;

        if ($voucher->min_purchase && $subtotal < $voucher->min_purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Minimal pembelian untuk voucher ini adalah Rp ' . number_format($voucher->min_purchase, 0, ',', '.'),
            ], 422);
        }

        $discount = $voucher->calculateDiscount($subtotal);

        return response()->json([
            'success' => true,
            'message' => 'Voucher berhasil diterapkan!',
            'data'    => [
                'voucher_id'     => $voucher->id,
                'code'           => $voucher->code,
                'discount'       => $discount,
                'discount_type'  => $voucher->discount_type,
                'discount_value' => $voucher->discount_value,
            ],
        ]);
    }
}
