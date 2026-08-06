<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->referrals->dashboard($request->user()),
        ]);
    }

    public function activateAffiliate(Request $request): JsonResponse
    {
        $code = $this->referrals->activateAffiliate($request->user());

        return response()->json([
            'success' => true,
            'data' => [
                'is_affiliate' => $code->is_affiliate,
                'code' => $code->code,
                'commission_rate' => (float) $code->commission_rate,
            ],
        ]);
    }

    public function payout(Request $request): JsonResponse
    {
        $result = $this->referrals->payout($request->user());

        return response()->json([
            'success' => true,
            'message' => $result['paid'] > 0
                ? "{$result['paid']} reward senilai Rp".number_format($result['amount'], 0, ',', '.').' telah diproses.'
                : 'Tidak ada reward yang menunggu payout.',
            'data' => $result,
        ]);
    }
}
