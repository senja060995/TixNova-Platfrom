<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Ticket;

class InventoryReservationService
{
    public function __construct(private SeatReservationService $seats) {}

    public function release(Order $order): void
    {
        $this->seats->release($order);

        $quantities = $order->items()
            ->selectRaw('ticket_id, sum(quantity) as quantity')
            ->groupBy('ticket_id')
            ->pluck('quantity', 'ticket_id');

        foreach ($quantities as $ticketId => $quantity) {
            $ticket = Ticket::lockForUpdate()->findOrFail($ticketId);
            $ticket->reserved = max(0, $ticket->reserved - (int) $quantity);
            $ticket->save();
        }
    }

    public function returnToInventory(Order $order): void
    {
        $this->seats->returnToInventory($order);

        $quantities = $order->items()
            ->selectRaw('ticket_id, sum(quantity) as quantity')
            ->groupBy('ticket_id')
            ->pluck('quantity', 'ticket_id');

        foreach ($quantities as $ticketId => $quantity) {
            $ticket = Ticket::lockForUpdate()->findOrFail($ticketId);
            $ticket->sold = max(0, $ticket->sold - (int) $quantity);
            $ticket->save();
        }
    }

    public function convertToSold(Order $order): void
    {
        $this->seats->sell($order);

        $quantities = $order->items()
            ->selectRaw('ticket_id, sum(quantity) as quantity')
            ->groupBy('ticket_id')
            ->pluck('quantity', 'ticket_id');

        foreach ($quantities as $ticketId => $quantity) {
            $ticket = Ticket::lockForUpdate()->findOrFail($ticketId);
            $quantity = (int) $quantity;

            if ($ticket->reserved < $quantity) {
                throw new \RuntimeException('Reservasi tiket tidak valid.');
            }

            $ticket->reserved -= $quantity;
            $ticket->sold += $quantity;
            $ticket->save();
        }
    }
}
