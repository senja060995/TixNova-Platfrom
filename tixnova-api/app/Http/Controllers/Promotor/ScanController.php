<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OrderItem;
use App\Models\ScanLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanController extends Controller
{
    public function scan(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'qr_code' => ['required', 'string', 'max:255'],
        ]);

        $this->authorizeEvent($request, $event);

        return DB::transaction(function () use ($data, $event, $request) {
            $item = OrderItem::query()
                ->where('qr_code', $data['qr_code'])
                ->whereHas('order', fn ($query) => $query
                    ->withoutGlobalScopes()
                    ->where('event_id', $event->id))
                ->with(['order.event', 'ticket'])
                ->lockForUpdate()
                ->first();

            if (! $item) {
                return $this->invalidResponse($data['qr_code'], $event, $request);
            }

            if ($item->order->status !== 'paid') {
                $this->log($item, $event, $request, 'invalid');

                return response()->json([
                    'success' => false,
                    'message' => 'Tiket belum lunas.',
                ], 422);
            }

            if ($item->qr_used) {
                $this->log($item, $event, $request, 'already_used');

                return response()->json([
                    'success' => false,
                    'message' => 'Tiket sudah digunakan.',
                    'data' => [
                        'attendee_name' => $item->attendee_name,
                        'ticket_name' => $item->ticket->name,
                        'qr_used_at' => $item->qr_used_at?->format('H:i:s d M Y'),
                    ],
                ], 422);
            }

            $scannedAt = now();
            $item->update([
                'qr_used' => true,
                'qr_used_at' => $scannedAt,
            ]);
            $this->log($item, $event, $request, 'valid', $scannedAt);

            return response()->json([
                'success' => true,
                'message' => 'Check-in berhasil.',
                'data' => [
                    'attendee_name' => $item->attendee_name,
                    'attendee_email' => $item->attendee_email,
                    'ticket_name' => $item->ticket->name,
                    'event_title' => $item->order->event->title,
                    'scanned_at' => $scannedAt->format('H:i:s d M Y'),
                ],
            ]);
        });
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && $event->tenant_id !== $user->tenant_id) {
            abort(403, 'Anda tidak memiliki akses ke event ini.');
        }
    }

    private function invalidResponse(string $qrCode, Event $event, Request $request): JsonResponse
    {
        $item = OrderItem::query()
            ->where('qr_code', $qrCode)
            ->with('order')
            ->first();

        if ($item) {
            $this->log($item, $event, $request, 'wrong_event');

            return response()->json([
                'success' => false,
                'message' => 'Tiket ini milik event lain.',
            ], 422);
        }

        return response()->json([
            'success' => false,
            'message' => 'Tiket tidak ditemukan.',
        ], 404);
    }

    private function log(OrderItem $item, Event $event, Request $request, string $status, mixed $scannedAt = null): void
    {
        ScanLog::create([
            'order_item_id' => $item->id,
            'event_id' => $event->id,
            'scanned_by' => $request->user()->id,
            'scan_status' => $status,
            'device_info' => substr((string) $request->userAgent(), 0, 255) ?: null,
            'scanned_at' => $scannedAt ?? now(),
        ]);
    }
}
