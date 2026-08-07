<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function __construct(private WithdrawalService $withdrawals) {}

    public function balance(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->withdrawals->balance($request->user()->tenant_id),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $withdrawals = Withdrawal::with(['reviewer:id,name', 'processor:id,name'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('requested_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:10000'],
            'bank_name' => ['required', 'string', 'max:100'],
            'bank_account_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'max:50'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $withdrawal = $this->withdrawals->request($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan penarikan dana telah diajukan. Menunggu persetujuan admin.',
            'data' => $withdrawal,
        ], 201);
    }

    public function cancel(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawals->cancel($withdrawal, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Permintaan penarikan dana dibatalkan.',
            'data' => $withdrawal,
        ]);
    }
}
