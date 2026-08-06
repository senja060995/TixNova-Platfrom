<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\ReviewEventRescheduleRequest;
use App\Models\Event;
use App\Models\EventReschedule;
use App\Services\EventRescheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventApprovalController extends Controller
{
    public function __construct(private EventRescheduleService $reschedules) {}

    /**
     * List events pending approval.
     */
    public function pendingEvents(Request $request): JsonResponse
    {
        $events = Event::withoutGlobalScope('tenant')
            ->with(['tenant', 'user', 'category', 'tickets'])
            ->where('status', 'pending')
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * Approve an event.
     */
    public function approve(Event $event): JsonResponse
    {
        if ($event->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Event hanya bisa diapprove jika statusnya pending.',
            ], 422);
        }

        $event->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
            'reject_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil diapprove.',
            'data' => $event,
        ]);
    }

    /**
     * Reject an event.
     */
    public function reject(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'min:10'],
        ]);

        if ($event->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Event hanya bisa direject jika statusnya pending.',
            ], 422);
        }

        $event->update([
            'status' => 'rejected',
            'reject_reason' => $request->reason,
            'approved_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil direject.',
            'data' => $event,
        ]);
    }

    public function reschedules(Request $request): JsonResponse
    {
        $reschedules = EventReschedule::with(['event:id,title,venue,city', 'requester'])
            ->where('status', 'requested')
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => $reschedules]);
    }

    public function reviewReschedule(ReviewEventRescheduleRequest $request, EventReschedule $reschedule): JsonResponse
    {
        $reschedule = $this->reschedules->review(
            $reschedule,
            $request->user(),
            $request->boolean('approved'),
            $request->input('review_note'),
        );

        return response()->json([
            'success' => true,
            'message' => $reschedule->status === 'approved' ? 'Perubahan jadwal disetujui dan pembeli akan diberi notifikasi.' : 'Perubahan jadwal ditolak.',
            'data' => $reschedule,
        ]);
    }

    /**
     * Feature/unfeature an event.
     */
    public function toggleFeatured(Event $event): JsonResponse
    {
        $event->update(['is_featured' => ! $event->is_featured]);

        return response()->json([
            'success' => true,
            'message' => 'Status featured berhasil diubah.',
            'data' => ['is_featured' => $event->is_featured],
        ]);
    }
}
