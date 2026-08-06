"use client";

import { useMemo } from "react";
import { Armchair, Loader2 } from "lucide-react";
import { SeatMap, Ticket } from "@/types";
import { SeatData, SeatMapViewer } from "./SeatMapViewer";

interface SeatFirstPickerProps {
  seatMap: SeatMap | null;
  tickets: Ticket[];
  selectedSeatIds: number[];
  loading?: boolean;
  onToggle: (seat: SeatData) => void;
}

export function SeatFirstPicker({
  seatMap,
  tickets,
  selectedSeatIds,
  loading = false,
  onToggle,
}: SeatFirstPickerProps) {
  const ticketById = useMemo(
    () => new Map(tickets.map((ticket) => [ticket.id, ticket])),
    [tickets]
  );
  const selectedSeats = useMemo(
    () => seatMap?.seats.filter((seat) => selectedSeatIds.includes(seat.id)) || [],
    [seatMap?.seats, selectedSeatIds]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-bg-border bg-bg-surface p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!seatMap) return null;

  return (
    <div className="space-y-4">
      <SeatMapViewer
        seats={seatMap.seats}
        selectedSeatIds={selectedSeatIds}
        onToggle={onToggle}
      />
      <div className="rounded-xl border border-bg-border bg-bg-elevated p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Armchair className="h-4 w-4 text-primary" />
          Kursi Terpilih
        </div>
        {selectedSeats.length ? (
          <div className="mt-3 space-y-2">
            {selectedSeats.map((seat) => {
              const ticket = ticketById.get(seat.ticket_id);

              return (
                <div key={seat.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{seat.label} · {ticket?.name || "Kursi"}</span>
                  <span className="font-bold text-primary">
                    {ticket ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(ticket.price) : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-text-muted">Pilih kursi untuk menampilkan harga tiket.</p>
        )}
      </div>
    </div>
  );
}
