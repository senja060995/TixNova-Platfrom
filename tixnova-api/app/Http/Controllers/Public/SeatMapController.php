<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

class SeatMapController extends Controller
{
    public function show(Event $event): JsonResponse
    {
        $map = $event->seatMap()
            ->where('is_published', true)
            ->with('seats')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $map->id,
                'name' => $map->name,
                'seats' => $map->seats->map(fn ($seat) => [
                    'id' => $seat->id,
                    'ticket_id' => $seat->ticket_id,
                    'section' => $seat->section,
                    'row_label' => $seat->row_label,
                    'number' => $seat->number,
                    'label' => $seat->label,
                    'status' => $seat->status,
                ])->values(),
            ],
        ]);
    }
}
