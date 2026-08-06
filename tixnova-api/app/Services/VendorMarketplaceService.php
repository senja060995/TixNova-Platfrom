<?php

namespace App\Services;

use App\Models\Rfq;
use App\Models\RfqOffer;
use App\Models\VendorBooking;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendorMarketplaceService
{
    /**
     * Release the deposit escrow once the event has ended and the
     * booking is confirmed/fulfilled. Otherwise returns refunded.
     */
    public function release(VendorBooking $booking): array
    {
        $event = $booking->event;

        if ($event->end_date && $event->end_date->gte(now())) {
            throw ValidationException::withMessages([
                'event' => 'Dana hanya dapat dilepas setelah event selesai.',
            ]);
        }

        if (! in_array($booking->status, [VendorBooking::STATUS_CONFIRMED, VendorBooking::STATUS_FULFILLED])) {
            throw ValidationException::withMessages([
                'status' => 'Booking harus dikonfirmasi terlebih dahulu.',
            ]);
        }

        $booking->update([
            'status' => VendorBooking::STATUS_RELEASED,
            'released_at' => now(),
        ]);

        return [
            'booking' => $booking->load('vendor', 'event'),
            'outcome' => 'released',
        ];
    }

    /**
     * Award an RFQ offer to a vendor → creates a confirmed booking with escrow deposit.
     */
    public function award(Rfq $rfq, RfqOffer $offer): VendorBooking
    {
        return DB::transaction(function () use ($rfq, $offer) {
            $rfq->offers()->update(['is_winner' => false]);

            $offer->update(['is_winner' => true]);
            $rfq->update(['status' => Rfq::STATUS_AWARDED]);

            $quote = (float) $offer->quote;

            return $rfq->event->vendorBookings()->create([
                'tenant_id' => $rfq->tenant_id,
                'vendor_id' => $offer->vendor_id,
                'service' => $rfq->service,
                'amount' => $quote,
                'deposit_pct' => 20,
                'deposit' => round($quote * 0.2, 2),
                'status' => VendorBooking::STATUS_CONFIRMED,
                'notes' => "Dari RFQ {$rfq->service}".($offer->message ? ": {$offer->message}" : ''),
            ]);
        });
    }
}
