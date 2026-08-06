<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Event\CreateEventRequest;
use App\Http\Requests\Event\CreateEventRescheduleRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Models\Event;
use App\Services\EventRescheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function __construct(private EventRescheduleService $reschedules) {}

    /**
     * List all events for the current promotor's tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $events = Event::with(['category', 'tickets', 'translations'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * Create a new event.
     */
    public function store(CreateEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();
        $data['slug'] = Str::slug($data['title']).'-'.Str::random(6);

        $translations = $data['translations'] ?? null;
        unset($data['translations']);

        $event = Event::create($data);

        if ($translations && is_array($translations)) {
            $this->saveTranslations($event, $translations);
        }

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil dibuat. Silakan upload banner dan tambahkan tiket.',
            'data' => $event->load(['category', 'tickets', 'translations']),
        ], 201);
    }

    /**
     * Get event detail.
     */
    public function show(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $event->load(['category', 'tickets', 'user', 'translations', 'reschedules' => fn ($query) => $query->latest()]),
        ]);
    }

    /**
     * Update event.
     */
    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($event);

        if (! in_array($event->status, ['draft', 'rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Event yang sudah disubmit tidak dapat diubah. Hubungi admin.',
            ], 422);
        }

        $data = $request->validated();
        $translations = $data['translations'] ?? null;
        unset($data['translations']);

        $event->update($data);

        if ($translations && is_array($translations)) {
            $this->saveTranslations($event, $translations);
        }

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil diperbarui.',
            'data' => $event->fresh(['category', 'tickets', 'translations']),
        ]);
    }

    private function saveTranslations(Event $event, array $translations): void
    {
        foreach ($translations as $locale => $transData) {
            $loc = is_numeric($locale) && isset($transData['locale']) ? $transData['locale'] : $locale;
            if (! empty($loc) && is_array($transData)) {
                $event->translations()->updateOrCreate(
                    ['locale' => $loc],
                    [
                        'title' => $transData['title'] ?? $event->title,
                        'description' => $transData['description'] ?? null,
                        'short_desc' => $transData['short_desc'] ?? null,
                        'venue_detail' => $transData['venue_detail'] ?? null,
                        'meta_title' => $transData['meta_title'] ?? null,
                        'meta_description' => $transData['meta_description'] ?? null,
                        'status' => 'published',
                    ]
                );
            }
        }
    }

    /**
     * Delete event (draft only).
     */
    public function destroy(Event $event): JsonResponse
    {
        $this->authorizeEvent($event);

        if ($event->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya event dengan status draft yang dapat dihapus.',
            ], 422);
        }

        $event->delete();

        return response()->json(['success' => true, 'message' => 'Event berhasil dihapus.']);
    }

    /**
     * Upload event banner/poster.
     */
    public function uploadBanner(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($event);

        $request->validate([
            'banner' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('banner')->store('events/banners', 'public');

        // Delete old banner
        if ($event->banner) {
            Storage::disk('public')->delete($event->banner);
        }

        $event->update(['banner' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Banner berhasil diupload.',
            'data' => ['banner_url' => Storage::disk('public')->url($path)],
        ]);
    }

    public function requestReschedule(CreateEventRescheduleRequest $request, Event $event): JsonResponse
    {
        $reschedule = $this->reschedules->request($event, $request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perubahan jadwal berhasil dikirim untuk review admin.',
            'data' => $reschedule,
        ], 201);
    }

    /**
     * Submit event for review.
     */
    public function publish(Event $event): JsonResponse
    {
        $this->authorizeEvent($event);

        if (! in_array($event->status, ['draft', 'rejected'])) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak dapat disubmit saat ini. Status: '.$event->status,
            ], 422);
        }

        // Validate event has tickets
        if ($event->tickets()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Event harus memiliki minimal satu tiket sebelum disubmit.',
            ], 422);
        }

        $event->update(['status' => 'pending']);

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil disubmit untuk review. Menunggu persetujuan admin.',
            'data' => $event,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function authorizeEvent(Event $event): void
    {
        if ($event->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized.');
        }
    }
}
