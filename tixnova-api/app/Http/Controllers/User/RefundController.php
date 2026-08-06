<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\CreateRefundRequest;
use App\Models\Order;
use App\Models\Refund;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RefundController extends Controller
{
    public function __construct(private RefundService $refunds) {}

    public function index(Request $request): JsonResponse
    {
        $refunds = Refund::with(['order.event', 'payment'])
            ->where('requested_by', $request->user()->id)
            ->latest('requested_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => $refunds]);
    }

    public function store(CreateRefundRequest $request, string $orderCode): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->with(['event', 'items', 'payment', 'refund'])
            ->where('order_code', $orderCode)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $refund = $this->refunds->request($order, $request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => $refund->status === 'approved' ? 'Event dibatalkan. Refund otomatis disetujui.' : 'Permintaan refund berhasil dikirim.',
            'data' => $refund,
        ], 201);
    }
}
