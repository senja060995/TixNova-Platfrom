<?php

namespace App\Services;

use App\Jobs\SendEventRescheduleNotification;
use App\Models\Event;
use App\Models\EventReschedule;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventRescheduleService
{
    public function request(Event $event, User $promotor, array $data): EventReschedule
    {
        return DB::transaction(function () use ($event, $promotor, $data) {
            $event = Event::withoutGlobalScopes()->whereKey($event->id)->lockForUpdate()->firstOrFail();

            if ($event->tenant_id !== $promotor->tenant_id) {
                abort(404);
            }

            if ($event->status !== 'approved' || ! $event->start_date->isFuture()) {
                throw ValidationException::withMessages([
                    'event' => 'Hanya event aktif yang belum dimulai dapat dijadwalkan ulang.',
                ]);
            }

            if ($event->reschedules()->where('status', 'requested')->exists()) {
                throw ValidationException::withMessages([
                    'event' => 'Masih ada permintaan perubahan jadwal yang menunggu review.',
                ]);
            }

            return EventReschedule::create([
                'event_id' => $event->id,
                'requested_by' => $promotor->id,
                'previous_start_date' => $event->start_date,
                'previous_end_date' => $event->end_date,
                'new_start_date' => $data['new_start_date'],
                'new_end_date' => $data['new_end_date'],
                'reason' => $data['reason'],
            ]);
        });
    }

    public function review(EventReschedule $reschedule, User $admin, bool $approved, ?string $note): EventReschedule
    {
        $result = DB::transaction(function () use ($reschedule, $admin, $approved, $note) {
            $reschedule = EventReschedule::with('event')->whereKey($reschedule->id)->lockForUpdate()->firstOrFail();

            if ($reschedule->status !== 'requested') {
                throw ValidationException::withMessages([
                    'reschedule' => 'Permintaan perubahan jadwal ini sudah ditinjau.',
                ]);
            }

            $reschedule->update([
                'status' => $approved ? 'approved' : 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'review_note' => $note,
            ]);

            if ($approved) {
                $reschedule->event->update([
                    'start_date' => $reschedule->new_start_date,
                    'end_date' => $reschedule->new_end_date,
                ]);
            }

            return $reschedule->fresh('event');
        });

        if ($result->status === 'approved') {
            SendEventRescheduleNotification::dispatch($result->id);
        }

        return $result;
    }
}
