<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\ReviewRefundRequest;
use App\Models\Refund;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RefundController extends Controller
{
    public function __construct(private RefundService $refunds) {}

    public function index(Request $request): JsonResponse
    {
        $refunds = Refund::with(['order.event', 'requester'])
            ->whereHas('order', fn ($query) => $query->withoutGlobalScopes()->where('tenant_id', $request->user()->tenant_id))
            ->latest('requested_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => $refunds]);
    }

    public function review(ReviewRefundRequest $request, Refund $refund): JsonResponse
    {
        $refund = $this->refunds->review(
            $refund,
            $request->user(),
            $request->boolean('approved'),
            $request->input('review_note'),
        );

        return response()->json([
            'success' => true,
            'message' => $refund->status === 'approved' ? 'Refund disetujui.' : 'Refund ditolak.',
            'data' => $refund,
        ]);
    }
}
