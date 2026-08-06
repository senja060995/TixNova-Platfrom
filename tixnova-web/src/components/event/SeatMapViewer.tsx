"use client";

import { useMemo } from "react";
import { Armchair } from "lucide-react";

export interface SeatData {
  id: number;
  ticket_id: number | null;
  section: string;
  row_label: string;
  number: number;
  label: string;
  status: "available" | "held" | "sold" | "blocked";
}

interface SeatMapViewerProps {
  seats: SeatData[];
  selectedSeatIds: number[];
  onToggle: (seat: SeatData) => void;
  disabled?: boolean;
}

export function SeatMapViewer({ seats, selectedSeatIds, onToggle, disabled = false }: SeatMapViewerProps) {
  const sections = useMemo(() => {
    return Object.entries(seats.reduce<Record<string, SeatData[]>>((groups, seat) => {
      groups[seat.section] ??= [];
      groups[seat.section].push(seat);
      return groups;
    }, {}));
  }, [seats]);

  return <div className="space-y-5 rounded-2xl border border-bg-border bg-bg-surface p-5"><div className="flex items-center gap-2 text-white"><Armchair className="h-5 w-5 text-primary" /><h3 className="font-bold">Pilih Kursi</h3></div><div className="flex flex-wrap gap-3 text-xs text-text-muted"><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-primary" /> Dipilih</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-success" /> Tersedia</span><span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-bg-border" /> Tidak tersedia</span></div>{sections.map(([section, sectionSeats]) => <div key={section} className="space-y-2"><p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Section {section}</p>{Object.entries(sectionSeats.reduce<Record<string, SeatData[]>>((rows, seat) => { rows[seat.row_label] ??= []; rows[seat.row_label].push(seat); return rows; }, {})).map(([row, rowSeats]) => <div key={row} className="flex items-center gap-2"><span className="w-6 text-xs font-bold text-text-muted">{row}</span><div className="flex flex-wrap gap-1.5">{rowSeats.sort((a, b) => a.number - b.number).map((seat) => { const selected = selectedSeatIds.includes(seat.id); const available = seat.status === "available"; return <button key={seat.id} type="button" disabled={disabled || !available} onClick={() => onToggle(seat)} title={seat.label} className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold ${selected ? "bg-primary text-white" : available ? "bg-success/20 text-success hover:bg-success hover:text-white" : "cursor-not-allowed bg-bg-border text-text-muted"}`}>{seat.number}</button>; })}</div></div>)}</div>)}</div>;
}
