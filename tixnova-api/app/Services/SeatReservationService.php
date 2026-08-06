<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Seat;
use App\Models\SeatMap;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class SeatReservationService
{
    public function hold(SeatMap $seatMap, Order $order, array $seatsByTicket): Collection
    {
        $seatIds = collect($seatsByTicket)->flatten()->map(fn ($seatId) => (int) $seatId)->values();

        if ($seatIds->count() !== $seatIds->unique()->count()) {
            throw ValidationException::withMessages(['items' => 'Kursi tidak boleh dipilih lebih dari satu kali.']);
        }

        // Auto-release expired seat holds (>15 mins) or holds from expired/cancelled orders
        Seat::whereIn('id', $seatIds)
            ->where('status', 'held')
            ->where(function ($query) use ($order) {
                $query->where('held_at', '<', now()->subMinutes(15))
                    ->orWhere('hold_order_id', $order->id)
                    ->orWhereHas('holdOrder', function ($orderQ) {
                        $orderQ->whereIn('status', ['expired', 'cancelled']);
                    });
            })
            ->update([
                'status' => 'available',
                'hold_order_id' => null,
                'held_at' => null,
            ]);

        $seats = Seat::where('seat_map_id', $seatMap->id)
            ->whereIn('id', $seatIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($seats->count() !== $seatIds->count()) {
            throw ValidationException::withMessages(['items' => 'Kursi tidak valid untuk event ini.']);
        }

        foreach ($seatsByTicket as $ticketId => $selectedSeatIds) {
            foreach ($selectedSeatIds as $seatId) {
                $seat = $seats->get((int) $seatId);

                if ($seat->ticket_id !== (int) $ticketId || $seat->status !== 'available') {
                    throw ValidationException::withMessages(['items' => 'Satu atau lebih kursi sudah tidak tersedia.']);
                }
            }
        }

        foreach ($seats as $seat) {
            $seat->update([
                'status' => 'held',
                'hold_order_id' => $order->id,
                'held_at' => now(),
            ]);
        }

        if (! $seatMap->locked_at) {
            $seatMap->update(['locked_at' => now()]);
        }

        return $seats;
    }

    public function release(Order $order): void
    {
        Seat::where('hold_order_id', $order->id)
            ->where('status', 'held')
            ->lockForUpdate()
            ->update([
                'status' => 'available',
                'hold_order_id' => null,
                'held_at' => null,
            ]);
    }

    public function sell(Order $order): void
    {
        Seat::where('hold_order_id', $order->id)
            ->where('status', 'held')
            ->lockForUpdate()
            ->update([
                'status' => 'sold',
                'hold_order_id' => null,
                'sold_at' => now(),
            ]);
    }

    public function returnToInventory(Order $order): void
    {
        Seat::whereIn('id', $order->items()->whereNotNull('seat_id')->pluck('seat_id'))
            ->where('status', 'sold')
            ->lockForUpdate()
            ->update([
                'status' => 'available',
                'sold_at' => null,
            ]);
    }
}
