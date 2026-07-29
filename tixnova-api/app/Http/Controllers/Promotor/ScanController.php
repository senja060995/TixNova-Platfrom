<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ScanLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanController extends Controller
{
    /**
     * POST /api/promotor/scan — Check-in QR Code Tiket
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code'  => 'required|string',
            'event_id' => 'nullable|exists:events,id',
        ]);

        $item = OrderItem::with(['order.event', 'ticket'])
            ->where('qr_code', $request->qr_code)
            ->first();

        if (! $item) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket tidak ditemukan. Pastikan QR Code benar.',
            ], 404);
        }

        // Verify order is paid
        if ($item->order->status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => "Tiket belum lunas. Status order: {$item->order->status}",
            ], 422);
        }

        // Verify event match if event_id provided
        if ($request->filled('event_id') && $item->order->event_id != $request->event_id) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket ini milik event lain, bukan event ini.',
            ], 422);
        }

        // Check if QR already used
        if ($item->qr_used) {
            $usedTime = $item->qr_used_at ? $item->qr_used_at->format('H:i:s d M Y') : 'sebelumnya';

            // Log failed duplicate scan
            ScanLog::create([
                'order_item_id' => $item->id,
                'event_id'      => $item->order->event_id,
                'scanned_by'    => auth()->id(),
                'scan_status'   => 'already_used',
                'scanned_at'    => now(),
            ]);

            return response()->json([
                'success' => false,
                'message' => "⚠️ TIKET SUDAH DIGUNAKAN pada {$usedTime}.",
                'data'    => [
                    'attendee_name' => $item->attendee_name,
                    'ticket_name'   => $item->ticket->name,
                    'qr_used_at'    => $usedTime,
                ],
            ], 422);
        }

        // Mark as used
        DB::beginTransaction();
        try {
            $item->update([
                'qr_used'    => true,
                'qr_used_at' => now(),
            ]);

            ScanLog::create([
                'order_item_id' => $item->id,
                'event_id'      => $item->order->event_id,
                'scanned_by'    => auth()->id(),
                'scan_status'   => 'valid',
                'scanned_at'    => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => '✅ CHECK-IN BERHASIL! Selamat Datang.',
                'data'    => [
                    'attendee_name' => $item->attendee_name,
                    'attendee_email' => $item->attendee_email,
                    'ticket_name'   => $item->ticket->name,
                    'event_title'   => $item->order->event->title,
                    'scanned_at'    => now()->format('H:i:s d M Y'),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses check-in: ' . $e->getMessage(),
            ], 500);
        }
    }
}
