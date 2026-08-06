<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\InsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    public function __construct(private InsightService $insights) {}

    public function overview(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->insights->overview(
                $request->user()->tenant_id,
                $request->integer('days', 30),
            ),
        ]);
    }

    public function benchmark(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->insights->benchmark(
                $request->filled('city') ? $request->string('city')->toString() : null,
                $request->filled('category_id') ? $request->integer('category_id') : null,
            ),
        ]);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->insights->eventInsight($event),
        ]);
    }

    public function daily(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->insights->eventDaily($event),
        ]);
    }
}
