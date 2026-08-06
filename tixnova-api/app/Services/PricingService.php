<?php

namespace App\Services;

use App\Models\Event;
use App\Models\OrderItem;
use App\Models\Ticket;
use Illuminate\Support\Collection;

class PricingService
{
    public function __construct(private FeatureStoreService $features) {}

    // ─── List (overview per event) ─────────────────────────────

    public function listFor(int $tenantId, int $limit = 20): Collection
    {
        $events = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('start_date', '>', now())
            ->orderBy('start_date')
            ->limit($limit)
            ->get();

        return $events->map(fn (Event $event) => $this->compact($event));
    }

    public function compact(Event $event): array
    {
        $demand = $this->demandFromFeatures($this->features->eventFeatures($event), $event);
        $market = $this->marketAnalysis($event);
        $rec = $this->recommendation($demand, $market);

        return [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'city' => $event->city,
            'status' => $event->status,
            'start_date' => $event->start_date?->toIso8601String(),
            'sell_through_pct' => round($demand['sell_through'] * 100),
            'days_to_event' => $demand['days_to_event'],
            'velocity_7d' => $demand['velocity_7d'],
            'health' => $this->health($demand),
            'urgency' => $rec['urgency'],
            'action' => $rec['action'],
            'promo_suggested' => $rec['promo']['suggested'],
            'reason' => $rec['reason'],
        ];
    }

    // ─── Detail recommendation ─────────────────────────────────

    public function recommendEvent(Event $event): array
    {
        $features = $this->features->refreshEvent($event);
        $demand = $this->demandFromFeatures($features, $event);
        $market = $this->marketAnalysis($event);
        $rec = $this->recommendation($demand, $market);

        $tickets = $event->tickets
            ->filter(fn (Ticket $t) => $t->is_active)
            ->values()
            ->map(fn (Ticket $t) => $this->ticketRecommendation($t, $rec, $market))
            ->all();

        return [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'city' => $event->city,
                'start_date' => $event->start_date?->toIso8601String(),
            ],
            'market' => $market,
            'demand' => $demand,
            'health' => $this->health($demand),
            'recommendation' => $rec,
            'tickets' => $tickets,
        ];
    }

    // ─── Forecast ──────────────────────────────────────────────

    public function forecast(Event $event, int $days = 30): array
    {
        $ticketForecasts = $event->tickets
            ->filter(fn (Ticket $t) => $t->is_active)
            ->values()
            ->map(fn (Ticket $t) => $this->forecastTicket($t, $this->ticketDailySeries($event, $t->id), $days))
            ->all();

        $projectedSales = array_sum(array_column($ticketForecasts, 'projected_sales'));
        $soldTotal = (int) $event->tickets()->sum('sold');
        $quotaTotal = (int) $event->tickets()->sum('quota');

        return [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'start_date' => $event->start_date?->toIso8601String(),
            ],
            'days' => $days,
            'tickets' => $ticketForecasts,
            'event_total' => [
                'sold' => $soldTotal,
                'quota' => $quotaTotal,
                'projected_remaining' => max(0, $quotaTotal - $soldTotal - $projectedSales),
                'projected_sell_through_pct' => $quotaTotal > 0
                    ? round(($soldTotal + $projectedSales) / $quotaTotal * 100)
                    : 0,
            ],
        ];
    }

    // ─── Anomalies ─────────────────────────────────────────────

    public function anomalies(int $tenantId, int $limit = 20): Collection
    {
        $events = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->where('start_date', '>', now()->subDays(1))
            ->get();

        $result = [];

        foreach ($events as $event) {
            $series = $this->dailySeries($event);

            if (count($series) < 3) {
                continue;
            }

            $dates = array_keys($series);
            $lastDate = end($dates);
            $values = array_values($series);
            $today = (int) $values[count($values) - 1];
            $previous = array_slice($values, 0, -1);
            $avgPrev = $previous ? array_sum($previous) / count($previous) : 0;

            if ($today >= 5 && $avgPrev > 0 && $today > $avgPrev * 3) {
                $result[] = [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'slug' => $event->slug,
                    'type' => 'spike',
                    'metric' => $today,
                    'date' => $lastDate,
                    'message' => "Lonjakan penjualan {$today} tiket pada {$lastDate} (rata-rata ".round($avgPrev, 1).'/hari). Cek kemungkinan promo viral atau anomali harga.',
                ];
            } elseif ($avgPrev > 0 && $today === 0 && $this->sellThrough($event) < 0.9) {
                $result[] = [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                    'slug' => $event->slug,
                    'type' => 'drop',
                    'metric' => 0,
                    'date' => $lastDate,
                    'message' => "Tidak ada penjualan sejak {$lastDate} padahal sebelumnya rata-rata ".round($avgPrev, 1).'/hari. Periksa penyebab penurunan.',
                ];
            }
        }

        return collect(array_slice($result, 0, $limit));
    }

    // ─── Market & demand analysis ──────────────────────────────

    private function marketAnalysis(Event $event): array
    {
        $similar = Event::withoutGlobalScopes()
            ->where('status', 'approved')
            ->where('start_date', '>', now())
            ->whereKeyNot($event->id)
            ->where(function ($q) use ($event) {
                if ($event->category_id) {
                    $q->orWhere('category_id', $event->category_id);
                }
                if ($event->city) {
                    $q->orWhere('city', $event->city);
                }
            })
            ->with(['tickets' => fn ($q) => $q->where('is_active', true)])
            ->limit(50)
            ->get();

        $prices = [];

        foreach ($similar as $similarEvent) {
            foreach ($similarEvent->tickets as $ticket) {
                $price = $ticket->currentPrice();
                if ($price > 0) {
                    $prices[] = $price;
                }
            }
        }

        return $this->stats($prices);
    }

    private function demandFromFeatures(array $features, Event $event): array
    {
        $prices = $event->tickets
            ->filter(fn (Ticket $t) => $t->is_active)
            ->map(fn (Ticket $t) => (float) $t->currentPrice())
            ->filter(fn ($p) => $p > 0)
            ->values();

        return [
            'sold_total' => (int) $features['demand.sold_total'],
            'quota_total' => (int) $features['demand.quota_total'],
            'sell_through' => (float) $features['demand.sell_through'],
            'sold_last_7d' => (int) $features['demand.sold_last_7d'],
            'velocity_7d' => (float) $features['demand.velocity_7d'],
            'days_on_sale' => (int) $features['demand.days_on_sale'],
            'days_to_event' => (int) $features['demand.days_to_event'],
            'avg_price' => $prices->count() ? (int) round($prices->avg()) : 0,
            'main_price' => $prices->first() ?? 0,
        ];
    }

    private function recommendation(array $d, array $m): array
    {
        $sellThrough = $d['sell_through'];
        $daysToEvent = $d['days_to_event'];
        $median = (float) $m['median'];
        $p75 = (float) $m['p75'];

        $urgency = 'low';
        if ($daysToEvent <= 3 || ($daysToEvent <= 14 && $sellThrough < 0.35)) {
            $urgency = 'high';
        } elseif ($sellThrough < 0.5 && $daysToEvent <= 30) {
            $urgency = 'medium';
        }

        $action = 'hold';
        $promo = ['suggested' => false, 'discount_pct' => null];
        $suggestedPrice = null;
        $reason = '';

        if ($sellThrough >= 0.75 && $daysToEvent > 14) {
            $action = 'raise';
            $suggestedPrice = $median > 0 ? (int) round(min($d['avg_price'] * 1.15, $p75 ?: $median * 1.1)) : null;
            $reason = 'Penjualan di atas 75% kuota dengan sisa waktu panjang. Naikkan harga untuk memaksimalkan margin.';
        } elseif ($daysToEvent <= 14 && $sellThrough < 0.35) {
            $action = 'promo';
            $promo = ['suggested' => true, 'discount_pct' => 20];
            $suggestedPrice = $median > 0 ? (int) round($median * 0.8) : null;
            $reason = 'Kurang dari 2 pekan dan okupansi di bawah 35%. Jalankan promo agar kursi tidak kosong.';
        } elseif ($sellThrough < 0.2 && $daysToEvent <= 30) {
            $action = 'promo';
            $promo = ['suggested' => true, 'discount_pct' => 15];
            $suggestedPrice = $median > 0 ? (int) round($median * 0.85) : null;
            $reason = 'Penjualan lambat. Berikan diskon moderat untuk menarik pembeli awal.';
        } elseif ($median > 0 && $d['avg_price'] > $p75 * 1.2) {
            $action = 'hold';
            $suggestedPrice = (int) round($p75);
            $reason = 'Harga di atas pasar (p75). Pertimbangkan menurunkan agar kompetitif.';
        } else {
            $reason = 'Harga kompetitif dengan pasar. Pertahankan posisi saat ini.';
        }

        return compact('action', 'suggestedPrice', 'promo', 'reason', 'urgency');
    }

    private function ticketRecommendation(Ticket $ticket, array $rec, array $market): array
    {
        $sellThrough = $ticket->quota > 0 ? $ticket->sold / $ticket->quota : 0;
        $price = $ticket->currentPrice();
        $action = 'hold';
        $suggested = null;
        $note = '';

        if ($sellThrough >= 0.9) {
            $action = 'nearly_sold_out';
            $note = 'Kursi hampir habis.';
        } elseif ($rec['action'] === 'raise' && $sellThrough >= 0.75) {
            $action = 'raise';
            $suggested = $rec['suggestedPrice'];
            $note = 'Permintaan tinggi.';
        } elseif ($rec['action'] === 'promo' && $sellThrough < 0.5) {
            $action = 'discount';
            $suggested = $rec['suggestedPrice'] ?: (int) round($price * (1 - ($rec['promo']['discount_pct'] ?? 15) / 100));
            $note = "Diskon {$rec['promo']['discount_pct']}% disarankan.";
        } elseif ($market['median'] > 0 && $price > $market['p75'] * 1.2) {
            $action = 'above_market';
            $note = 'Di atas pasar (p75).';
        }

        return [
            'id' => $ticket->id,
            'name' => $ticket->name,
            'price' => (float) $price,
            'sold' => $ticket->sold,
            'quota' => $ticket->quota,
            'sell_through_pct' => round($sellThrough * 100),
            'suggested_action' => $action,
            'suggested_price' => $suggested,
            'note' => $note,
        ];
    }

    private function health(array $d): int
    {
        $pace = $d['days_on_sale'] > 0 ? $d['sold_total'] / $d['days_on_sale'] : 0;
        $velocityRatio = $pace > 0 ? $d['velocity_7d'] / $pace : 0;

        return (int) round(min(100, max(0,
            $d['sell_through'] * 100 * 0.6 + min(100, $velocityRatio * 100) * 0.4
        )));
    }

    private function sellThrough(Event $event): float
    {
        $quota = (int) $event->tickets()->sum('quota');

        return $quota > 0 ? (int) $event->tickets()->sum('sold') / $quota : 0;
    }

    // ─── Forecast helpers ──────────────────────────────────────

    private function forecastTicket(Ticket $ticket, array $series, int $days): array
    {
        $remaining = max(0, $ticket->quota - $ticket->sold);
        $daysToEvent = $ticket->event->start_date
            ? max(0, (int) now()->startOfDay()->diffInDays($ticket->event->start_date->copy()->startOfDay()))
            : 0;
        $horizon = min($days, $daysToEvent);

        $values = array_values($series);
        $totalHistory = array_sum($values);

        if ($horizon === 0) {
            return $this->forecastResult($ticket, $values, $horizon, 0, 'no_time');
        }

        if (count($values) >= 4 && $totalHistory > 0) {
            $window = array_slice($values, -7);
            $avg = array_sum($window) / count($window);
            $n = count($values);
            [$slope] = $this->linearRegression(range(0, $n - 1), $values);

            $projected = 0.0;
            for ($i = 0; $i < $horizon; $i++) {
                $projected += max(0, $avg + $slope * $i);
            }

            return $this->forecastResult($ticket, $values, $horizon, round($projected), 'moving_average');
        }

        $projected = $horizon > 0 ? $remaining / $horizon * $horizon : 0;

        return $this->forecastResult($ticket, $values, $horizon, round($projected), 'baseline');
    }

    private function forecastResult(Ticket $ticket, array $values, int $horizon, int $projected, string $method): array
    {
        $projected = min(max(0, $ticket->quota - $ticket->sold), max(0, $projected));
        $total = $ticket->sold + $projected;

        return [
            'ticket_id' => $ticket->id,
            'name' => $ticket->name,
            'price' => (float) $ticket->currentPrice(),
            'sold' => $ticket->sold,
            'quota' => $ticket->quota,
            'remaining' => max(0, $ticket->quota - $ticket->sold),
            'history_points' => count($values),
            'daily_avg' => $values ? round(array_sum($values) / count($values), 2) : 0,
            'method' => $method,
            'projected_sales' => $projected,
            'projected_remaining' => max(0, $ticket->quota - $ticket->sold - $projected),
            'projected_sell_through_pct' => $ticket->quota > 0 ? round($total / $ticket->quota * 100) : 0,
        ];
    }

    private function linearRegression(array $x, array $y): array
    {
        $n = count($x);

        if ($n === 0) {
            return [0, 0];
        }

        $sx = array_sum($x);
        $sy = array_sum($y);
        $sxy = 0;
        $sxx = 0;

        for ($i = 0; $i < $n; $i++) {
            $sxy += $x[$i] * $y[$i];
            $sxx += $x[$i] * $x[$i];
        }

        $denom = $n * $sxx - $sx * $sx;

        if ($denom === 0) {
            return [0, $n > 0 ? $sy / $n : 0];
        }

        $slope = ($n * $sxy - $sx * $sy) / $denom;
        $intercept = ($sy - $slope * $sx) / $n;

        return [$slope, $intercept];
    }

    // ─── Daily sales series ────────────────────────────────────

    private function dailySeries(Event $event): array
    {
        return $this->dailySeriesQuery($event->id)->pluck('qty', 'd')->map(fn ($v) => (int) $v)->all();
    }

    private function ticketDailySeries(Event $event, int $ticketId): array
    {
        return $this->dailySeriesQuery($event->id, $ticketId)->pluck('qty', 'd')->map(fn ($v) => (int) $v)->all();
    }

    private function dailySeriesQuery(int $eventId, ?int $ticketId = null)
    {
        $query = OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.event_id', $eventId)
            ->where('orders.status', 'paid')
            ->selectRaw('DATE(orders.paid_at) AS d, SUM(order_items.quantity) AS qty')
            ->groupBy('d')
            ->orderBy('d');

        if ($ticketId) {
            $query->where('order_items.ticket_id', $ticketId);
        }

        return $query;
    }

    // ─── Stats helpers ─────────────────────────────────────────

    private function stats(array $values): array
    {
        if (empty($values)) {
            return ['count' => 0, 'min' => 0, 'max' => 0, 'avg' => 0, 'median' => 0, 'p25' => 0, 'p75' => 0];
        }

        sort($values);
        $n = count($values);
        $percentile = function (float $p) use ($values, $n) {
            if ($n === 1) {
                return (float) $values[0];
            }
            $idx = ($n - 1) * $p;
            $lo = (int) floor($idx);
            $hi = (int) ceil($idx);

            return $values[$lo] + ($values[$hi] - $values[$lo]) * ($idx - $lo);
        };

        return [
            'count' => $n,
            'min' => (int) round(min($values)),
            'max' => (int) round(max($values)),
            'avg' => (int) round(array_sum($values) / $n),
            'median' => (int) round($percentile(0.5)),
            'p25' => (int) round($percentile(0.25)),
            'p75' => (int) round($percentile(0.75)),
        ];
    }
}
