<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    public function __construct(private PricingService $pricing) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->pricing->listFor(
                $request->user()->tenant_id,
                $request->integer('limit', 20),
            ),
        ]);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->pricing->recommendEvent($event),
        ]);
    }

    public function forecast(Request $request, Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->pricing->forecast(
                $event,
                $request->integer('days', 30),
            ),
        ]);
    }

    public function anomalies(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->pricing->anomalies(
                $request->user()->tenant_id,
                $request->integer('limit', 20),
            ),
        ]);
    }
}
