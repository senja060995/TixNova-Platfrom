<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Http\Requests\SeatMap\UpsertSeatMapRequest;
use App\Models\Event;
use App\Models\SeatMap;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SeatMapController extends Controller
{
    public function show(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        return response()->json([
            'success' => true,
            'data' => $this->mapData($event->seatMap()->with('seats')->first()),
        ]);
    }

    public function upsert(UpsertSeatMapRequest $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $map = DB::transaction(function () use ($request, $event) {
            $map = $event->seatMap()->lockForUpdate()->first();

            if ($map && $map->locked_at) {
                throw ValidationException::withMessages(['seat_map' => 'Seat map tidak dapat diubah setelah ada kursi ditahan atau terjual.']);
            }

            foreach ($request->validated('sections') as $section) {
                if (! $event->tickets()->whereKey($section['ticket_id'])->exists()) {
                    throw ValidationException::withMessages(['sections' => 'Tier tiket harus milik event ini.']);
                }
            }

            $map ??= $event->seatMap()->create(['name' => $request->name]);
            $map->update([
                'name' => $request->name,
                'is_published' => $request->boolean('is_published'),
            ]);
            $map->seats()->delete();

            foreach ($request->validated('sections') as $section) {
                foreach ($section['rows'] as $row) {
                    for ($number = 1; $number <= $row['seats']; $number++) {
                        $map->seats()->create([
                            'ticket_id' => $section['ticket_id'],
                            'section' => $section['name'],
                            'row_label' => $row['label'],
                            'number' => $number,
                            'label' => "{$section['name']}-{$row['label']}{$number}",
                        ]);
                    }
                }
            }

            return $map->fresh('seats');
        });

        return response()->json([
            'success' => true,
            'message' => 'Seat map berhasil disimpan.',
            'data' => $this->mapData($map),
        ]);
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        if ($event->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }
    }

    private function mapData(?SeatMap $map): ?array
    {
        if (! $map) {
            return null;
        }

        return [
            'id' => $map->id,
            'name' => $map->name,
            'is_published' => $map->is_published,
            'locked_at' => $map->locked_at?->toIso8601String(),
            'seats' => $map->seats->map(fn ($seat) => [
                'id' => $seat->id,
                'ticket_id' => $seat->ticket_id,
                'section' => $seat->section,
                'row_label' => $seat->row_label,
                'number' => $seat->number,
                'label' => $seat->label,
                'status' => $seat->status,
            ])->values(),
        ];
    }
}
