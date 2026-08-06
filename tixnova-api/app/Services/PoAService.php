<?php

namespace App\Services;

use App\Models\Event;
use App\Models\OrderItem;
use App\Models\ScanLog;
use App\Models\Sponsorship;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class PoAService
{
    public function report(Event $event): array
    {
        $sold = (int) OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.event_id', $event->id)
            ->where('orders.status', 'paid')
            ->sum('order_items.quantity');

        $scannedItemIds = ScanLog::where('event_id', $event->id)
            ->where('scan_status', 'valid')
            ->distinct()
            ->pluck('order_item_id');

        $checkedIn = $scannedItemIds->count();

        $scannedItems = OrderItem::whereIn('id', $scannedItemIds)
            ->with(['order.user', 'ticket'])
            ->get();

        $userIds = $scannedItems->pluck('order.user_id')->unique()->filter()->values();
        $users = User::whereIn('id', $userIds)->get()->keyBy('id');

        $attendanceRate = $sold > 0 ? round($checkedIn / $sold * 100) : 0;

        return [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'start_date' => $event->start_date?->toIso8601String(),
            ],
            'summary' => [
                'tickets_sold' => $sold,
                'checked_in' => $checkedIn,
                'unique_attendees' => $userIds->count(),
                'no_show' => max(0, $sold - $checkedIn),
                'attendance_rate_pct' => $attendanceRate,
                'last_scan_at' => $this->lastScan($event),
            ],
            'segmentation' => [
                'by_gender' => $this->segment($users, fn (?User $u) => $u?->gender ?: 'Belum diisi'),
                'by_age_group' => $this->segment($users, function (?User $u) {
                    if (! $u?->birth_date) {
                        return 'Belum diisi';
                    }

                    $age = Carbon::parse($u->birth_date)->age;

                    return match (true) {
                        $age < 18 => '17 ke bawah',
                        $age <= 24 => '18-24',
                        $age <= 34 => '25-34',
                        $age <= 44 => '35-44',
                        default => '45+',
                    };
                }),
                'by_city' => $this->segment($users, fn (?User $u) => $u?->city ?: 'Belum diisi'),
            ],
            'by_ticket' => $scannedItems
                ->groupBy(fn (OrderItem $item) => $item->ticket?->name ?: 'Lainnya')
                ->map(fn ($group) => $group->count())
                ->sortDesc(),
            'series' => ScanLog::where('event_id', $event->id)
                ->where('scan_status', 'valid')
                ->selectRaw('DATE(scanned_at) AS d, COUNT(*) AS c')
                ->groupBy('d')
                ->orderBy('d')
                ->get()
                ->map(fn ($row) => ['date' => $row->d, 'checked_in' => (int) $row->c]),
        ];
    }

    /**
     * Release escrow when the event has ended and PoA threshold is met.
     * Returns the final status: released or refunded.
     */
    public function release(Sponsorship $sponsorship): array
    {
        $event = $sponsorship->event;

        if ($event->end_date && $event->end_date->gte(now())) {
            throw ValidationException::withMessages([
                'event' => 'Dana hanya dapat dilepas setelah event selesai.',
            ]);
        }

        $report = $this->report($event);
        $threshold = (int) $sponsorship->poa_threshold_pct;
        $met = $threshold === 0 || $report['summary']['attendance_rate_pct'] >= $threshold;

        $sponsorship->update([
            'status' => $met ? Sponsorship::STATUS_RELEASED : Sponsorship::STATUS_REFUNDED,
            'released_at' => now(),
        ]);

        return [
            'sponsorship' => $sponsorship->load('sponsor', 'event'),
            'poa' => $report,
            'threshold_met' => $met,
            'outcome' => $met ? 'released' : 'refunded',
        ];
    }

    private function lastScan(Event $event): ?string
    {
        $value = ScanLog::where('event_id', $event->id)
            ->where('scan_status', 'valid')
            ->max('scanned_at');

        return $value ? Carbon::parse($value)->toIso8601String() : null;
    }

    private function segment($users, callable $bucket): array
    {
        return $users
            ->groupBy(fn (User $u) => $bucket($u))
            ->map(fn ($group) => $group->count())
            ->sortDesc()
            ->all();
    }
}
