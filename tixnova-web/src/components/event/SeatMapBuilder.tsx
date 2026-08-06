"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Ticket { id: number; name: string; }
interface Row { label: string; seats: number; }
interface Section { name: string; ticket_id: number; rows: Row[]; }
interface SeatMapBuilderProps { tickets: Ticket[]; initialSections: Section[]; locked: boolean; onSave: (sections: Section[]) => Promise<void>; }

export function SeatMapBuilder({ tickets, initialSections, locked, onSave }: SeatMapBuilderProps) {
  const [sections, setSections] = useState<Section[]>(initialSections.length ? initialSections : [{ name: "A", ticket_id: tickets[0]?.id || 0, rows: [{ label: "A", seats: 10 }] }]);
  const [saving, setSaving] = useState(false);
  const updateSection = (index: number, patch: Partial<Section>) => setSections((current) => current.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...patch } : section));
  const updateRow = (sectionIndex: number, rowIndex: number, patch: Partial<Row>) => setSections((current) => current.map((section, currentSection) => currentSection === sectionIndex ? { ...section, rows: section.rows.map((row, currentRow) => currentRow === rowIndex ? { ...row, ...patch } : row) } : section));
  const save = async () => { setSaving(true); try { await onSave(sections); } finally { setSaving(false); } };

  return <div className="space-y-5 rounded-2xl border border-bg-border bg-bg-surface p-6"><div><h2 className="text-xl font-bold text-white">Seat Map Grid</h2><p className="text-sm text-text-secondary">Map terkunci setelah kursi pertama ditahan atau terjual.</p></div>{locked ? <p className="rounded-xl bg-accent/10 p-4 text-sm text-accent">Seat map sudah terkunci dan tidak dapat diubah.</p> : <><div className="space-y-4">{sections.map((section, sectionIndex) => <div key={sectionIndex} className="space-y-3 rounded-xl border border-bg-border bg-bg-elevated p-4"><div className="grid gap-3 sm:grid-cols-3"><Input value={section.name} onChange={(event) => updateSection(sectionIndex, { name: event.target.value })} placeholder="Nama section" className="bg-bg-surface border-bg-border text-white" /><select value={section.ticket_id} onChange={(event) => updateSection(sectionIndex, { ticket_id: Number(event.target.value) })} className="rounded-lg border border-bg-border bg-bg-surface px-3 text-sm text-white">{tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.name}</option>)}</select><Button variant="danger" size="sm" onClick={() => setSections((current) => current.filter((_, index) => index !== sectionIndex))}><Trash2 className="mr-2 h-4 w-4" />Hapus Section</Button></div>{section.rows.map((row, rowIndex) => <div key={rowIndex} className="grid gap-3 sm:grid-cols-3"><Input value={row.label} onChange={(event) => updateRow(sectionIndex, rowIndex, { label: event.target.value })} placeholder="Baris" className="bg-bg-surface border-bg-border text-white" /><Input type="number" min="1" max="100" value={row.seats} onChange={(event) => updateRow(sectionIndex, rowIndex, { seats: Number(event.target.value) })} placeholder="Jumlah kursi" className="bg-bg-surface border-bg-border text-white" /><Button variant="outline" size="sm" onClick={() => updateSection(sectionIndex, { rows: section.rows.filter((_, index) => index !== rowIndex) })}>Hapus Baris</Button></div>)}<Button variant="outline" size="sm" onClick={() => updateSection(sectionIndex, { rows: [...section.rows, { label: String.fromCharCode(65 + section.rows.length), seats: 10 }] })}><Plus className="mr-2 h-4 w-4" />Tambah Baris</Button></div>)}</div><div className="flex gap-3"><Button variant="outline" onClick={() => setSections((current) => [...current, { name: String.fromCharCode(65 + current.length), ticket_id: tickets[0]?.id || 0, rows: [{ label: "A", seats: 10 }] }])}><Plus className="mr-2 h-4 w-4" />Tambah Section</Button><Button onClick={save} loading={saving}>Simpan Seat Map</Button></div></>}</div>;
}
