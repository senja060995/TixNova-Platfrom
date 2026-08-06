<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    public function __construct(private CrmService $crm) {}

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->crm->buyerSummary($request->user()),
        ]);
    }

    public function recommendations(Request $request): JsonResponse
    {
        $events = $this->crm->recommendationsFor($request->user());

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }
}
