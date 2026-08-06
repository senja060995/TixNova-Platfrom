"use client";

import { useMemo, useState } from "react";
import { SeatMap } from "@/types";
import { SeatData, SeatMapViewer } from "./SeatMapViewer";

interface SeatMapPickerProps {
  seatMap: SeatMap;
  cartItems: Array<{ ticket_id: number; name: string; quantity: number }>;
  onSeatChange: (seatIds: number[]) => void;
}

export function SeatMapPicker({ seatMap, cartItems, onSeatChange }: SeatMapPickerProps) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const seatedItems = useMemo(
    () => cartItems.filter((item) => seatMap.seats.some((seat) => seat.ticket_id === item.ticket_id)),
    [cartItems, seatMap.seats]
  );

  const selectedCount = (ticketId: number) => selectedSeatIds.filter((seatId) => (
    seatMap.seats.find((seat) => seat.id === seatId)?.ticket_id === ticketId
  )).length;

  const handleToggle = (seat: SeatData) => {
    if (seat.status !== "available" || seat.ticket_id === null) return;

    const isSelected = selectedSeatIds.includes(seat.id);
    const item = seatedItems.find((cartItem) => cartItem.ticket_id === seat.ticket_id);

    if (!item) return;

    if (!isSelected && selectedCount(seat.ticket_id) >= item.quantity) return;

    const next = isSelected
      ? selectedSeatIds.filter((seatId) => seatId !== seat.id)
      : [...selectedSeatIds, seat.id];

    setSelectedSeatIds(next);
    onSeatChange(next);
  };

  if (!seatedItems.length) return null;

  return (
    <div className="space-y-4">
      <SeatMapViewer
        seats={seatMap.seats}
        selectedSeatIds={selectedSeatIds}
        onToggle={handleToggle}
      />
      <div className="space-y-1 text-xs text-text-muted">
        {seatedItems.map((item) => (
          <p key={item.ticket_id}>
            {item.name}: {selectedCount(item.ticket_id)}/{item.quantity} kursi dipilih
          </p>
        ))}
      </div>
    </div>
  );
}
