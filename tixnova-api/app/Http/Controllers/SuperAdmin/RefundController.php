<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Refund;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RefundController extends Controller
{
    public function __construct(private RefundService $refunds) {}

    public function index(Request $request): JsonResponse
    {
        $refunds = Refund::with(['order.event', 'requester', 'reviewer', 'processor'])
            ->latest('requested_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => $refunds]);
    }

    public function process(Request $request, Refund $refund): JsonResponse
    {
        $refund = $this->refunds->process($refund, $request->user());

        return response()->json([
            'success' => true,
            'message' => $refund->status === 'manual_required' ? 'Refund memerlukan transfer manual ke rekening pembeli.' : 'Refund sedang diproses melalui Midtrans.',
            'data' => $refund,
        ]);
    }

    public function confirmManual(Request $request, Refund $refund): JsonResponse
    {
        if ($refund->status !== 'manual_required') {
            abort(422, 'Refund ini bukan refund manual.');
        }

        $this->refunds->confirm($refund);

        return response()->json([
            'success' => true,
            'message' => 'Refund manual dikonfirmasi.',
        ]);
    }
}
