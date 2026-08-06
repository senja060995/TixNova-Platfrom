"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Share2,
  ShieldCheck,
  Ticket as TicketIcon,
  ChevronLeft,
  Building2,
  Sparkles,
  Plus,
  Minus,
  AlertCircle,
  Armchair
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareModal } from "@/components/ui/ShareModal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SeatFirstPicker } from "@/components/event/SeatFirstPicker";
import { Event, SeatMap, Ticket } from "@/types";
import { SeatData } from "@/components/event/SeatMapViewer";
import { publicApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

import { useLocale } from "@/components/LocaleProvider";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { locale } = useLocale();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({});
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [seatMapLoading, setSeatMapLoading] = useState(true);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);

  useEffect(() => {
    if (!slug) return;
    publicApi.events.show(slug, { lang: locale })
      .then((res) => {
        setEvent(res.data.data);
        setError(null);
      })
      .catch(() => {
        setError("Event tidak ditemukan atau sudah berakhir.");
      })
      .finally(() => setLoading(false));

    publicApi.events.seatMap(slug)
      .then((res) => setSeatMap(res.data.data))
      .catch(() => setSeatMap(null))
      .finally(() => setSeatMapLoading(false));
  }, [slug, locale]);

  const handleQuantityChange = (ticketId: number, delta: number, max: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const updated = Math.max(0, Math.min(max, current + delta));
      if (updated === 0) {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      }
      return { ...prev, [ticketId]: updated };
    });
  };

  const seatedTicketIds = new Set(seatMap?.seats.map((seat) => seat.ticket_id) || []);
  const selectedSeatQuantities = selectedSeatIds.reduce<Record<number, number>>((quantities, seatId) => {
    const seat = seatMap?.seats.find((current) => current.id === seatId);
    if (seat) quantities[seat.ticket_id] = (quantities[seat.ticket_id] || 0) + 1;
    return quantities;
  }, {});
  const selectedQuantities = { ...selectedTickets, ...selectedSeatQuantities };
  const selectedItems = event?.tickets?.flatMap((ticket) => {
    const quantity = selectedQuantities[ticket.id] || 0;
    return quantity ? [{ ticket, quantity }] : [];
  }) || [];
  const totalQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = selectedItems.reduce(
    (total, item) => total + Number(item.ticket.price) * item.quantity,
    0
  );

  const handleSeatToggle = (seat: SeatData) => {
    if (seat.status !== "available" || seat.ticket_id === null || !event) return;

    const ticket = event.tickets?.find((current) => current.id === seat.ticket_id);
    if (!ticket) return;

    const isSelected = selectedSeatIds.includes(seat.id);
    const selectedForTicket = selectedSeatQuantities[seat.ticket_id] || 0;
    const available = ticket.quota - (ticket.sold || 0);
    const maxPurchase = Math.min(ticket.max_purchase || 4, available);

    if (!isSelected && selectedForTicket >= maxPurchase) {
      toast.error(`Maksimal ${maxPurchase} kursi untuk tiket ${ticket.name}.`);
      return;
    }

    setSelectedSeatIds((current) => isSelected
      ? current.filter((seatId) => seatId !== seat.id)
      : [...current, seat.id]
    );
  };

  const handleCheckout = () => {
    if (totalQuantity === 0) {
      toast.error("Pilih minimal 1 kursi atau tiket untuk melanjutkan.");
      return;
    }

    const cartData = {
      event,
      items: selectedItems.map(({ ticket, quantity }) => ({
        ticket,
        quantity,
        seat_ids: seatMap?.seats
          .filter((seat) => seat.ticket_id === ticket.id && selectedSeatIds.includes(seat.id))
          .map((seat) => seat.id) || [],
      })),
      totalPrice,
    };

    localStorage.setItem("tixnova_cart", JSON.stringify(cartData));
    toast.success("Mengarahkan ke halaman checkout...");
    router.push(`/checkout?event=${event?.slug}`);
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base py-12 px-4 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-bg-elevated rounded w-32" />
        <div className="h-[400px] bg-bg-elevated rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 bg-bg-elevated rounded w-3/4" />
            <div className="h-6 bg-bg-elevated rounded w-1/2" />
            <div className="h-32 bg-bg-elevated rounded-xl" />
          </div>
          <div className="h-64 bg-bg-elevated rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Event Tidak Ditemukan</h2>
          <p className="text-text-secondary text-sm mb-6">{error || "Halaman yang kamu cari tidak tersedia."}</p>
          <Link href="/events">
            <Button className="bg-primary hover:bg-primary-dark">Kembali ke Browse Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary pb-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Jelajahi Events
        </Link>
      </div>

      {/* Banner / Poster Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="relative w-full h-[280px] sm:h-[400px] md:h-[480px] rounded-3xl overflow-hidden border border-bg-border group">
          <Image
            src={event.banner || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200"}
            alt={event.title}
            fill
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            {event.category && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary text-white shadow-lg shadow-primary/30 flex items-center gap-1.5">
                <CategoryIcon name={event.category.name} icon={event.category.icon} className="w-4 h-4" />
                <span>{event.category.name}</span>
              </span>
            )}
            {event.is_featured && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent text-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured
              </span>
            )}
          </div>

          <button
            onClick={handleShare}
            className="absolute top-6 right-6 p-3 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110"
            title="Bagikan Event"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Event Details & Ticket Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Key Specs */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              {event.title}
            </h1>
            <p className="text-text-secondary text-base leading-relaxed mb-6">
              {event.short_desc}
            </p>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-surface p-5 rounded-2xl border border-bg-border">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-text-muted font-medium block">Tanggal & Waktu</span>
                  <span className="text-sm font-semibold text-white">
                    {formatDate(event.start_date)}
                  </span>
                  <span className="text-xs text-text-secondary block mt-0.5">
                    {new Date(event.start_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-text-muted font-medium block">Lokasi / Venue</span>
                  <span className="text-sm font-semibold text-white block">{event.venue}</span>
                  <span className="text-xs text-text-secondary">{event.city}, {event.province}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-bg-border pb-4">
              <span>Deskripsi Event</span>
            </h2>
            <div className="text-text-secondary text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {seatMap && (
            <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xl font-bold text-white">
                  <Armchair className="w-5 h-5 text-primary" />
                  <h2>Pilih Kursi</h2>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  Pilih kursi terlebih dahulu. Harga tiket akan mengikuti area kursi yang dipilih.
                </p>
              </div>
              <SeatFirstPicker
                seatMap={seatMap}
                tickets={event.tickets || []}
                selectedSeatIds={selectedSeatIds}
                loading={seatMapLoading}
                onToggle={handleSeatToggle}
              />
            </div>
          )}

          {/* Organizer / Promotor Info */}
          {event.tenant && (
            <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xl border border-primary/30 shrink-0">
                {event.tenant.logo ? (
                  <Image src={event.tenant.logo} alt={event.tenant.name} width={56} height={56} className="rounded-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs text-text-muted block">Penyelenggara Event</span>
                <h4 className="text-base font-bold text-white">{event.tenant.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-success mt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Promotor Terverifikasi</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tickets List Selector */}
        <div className="space-y-6">
          <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-6 sticky top-24 shadow-xl">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <TicketIcon className="w-5 h-5 text-primary" />
                <span>Pilihan Tiket</span>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {event.tickets?.length || 0} Kategori
              </span>
            </div>

            {/* Ticket Tier List */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {event.tickets && event.tickets.length > 0 ? (
                event.tickets.map((ticket: Ticket) => {
                  const available = ticket.quota - (ticket.sold || 0);
                  const isSoldOut = available <= 0;
                  const isSeated = seatedTicketIds.has(ticket.id);
                  const selectedQty = selectedQuantities[ticket.id] || 0;
                  const maxBuy = Math.min(ticket.max_purchase || 4, available);

                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedQty > 0
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/10"
                          : isSoldOut
                          ? "bg-bg-elevated/40 border-bg-border opacity-50"
                          : "bg-bg-elevated border-bg-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white text-base">{ticket.name}</h4>
                          <span className="text-xs text-text-secondary capitalize">{ticket.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-primary block">
                            {Number(ticket.price) === 0 ? "Gratis" : formatCurrency(Number(ticket.price))}
                          </span>
                        </div>
                      </div>

                      {ticket.description && (
                        <p className="text-xs text-text-muted mb-3 line-clamp-2">{ticket.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-bg-border/60 text-xs">
                        <span className={isSoldOut ? "text-danger font-semibold" : "text-text-secondary"}>
                          {isSoldOut ? "Habis Terjual" : `Tersisa ${available} tiket`}
                        </span>

                        {isSeated ? (
                          <span className="text-right text-xs font-semibold text-primary">
                            {selectedQty ? `${selectedQty} kursi dipilih` : "Pilih dari denah kursi"}
                          </span>
                        ) : !isSoldOut && (
                          <div className="flex items-center gap-2 bg-bg-surface border border-bg-border rounded-lg p-1">
                            <button
                              onClick={() => handleQuantityChange(ticket.id, -1, maxBuy)}
                              disabled={selectedQty === 0}
                              className="w-7 h-7 rounded flex items-center justify-center bg-bg-elevated hover:bg-primary/20 text-white disabled:opacity-30"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-bold text-white text-sm">{selectedQty}</span>
                            <button
                              onClick={() => handleQuantityChange(ticket.id, 1, maxBuy)}
                              disabled={selectedQty >= maxBuy}
                              className="w-7 h-7 rounded flex items-center justify-center bg-primary hover:bg-primary-dark text-white disabled:opacity-30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-text-secondary text-sm">
                  Tidak ada tiket tersedia untuk event ini.
                </div>
              )}
            </div>

            {/* Total Summary Footer */}
            <div className="border-t border-bg-border pt-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Jumlah Tiket:</span>
                <span className="font-bold text-white">{totalQuantity} tiket</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <span className="text-text-secondary">Total Harga:</span>
                <span className="text-xl font-extrabold text-primary">{formatCurrency(totalPrice)}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={totalQuantity === 0}
                className="w-full py-4 text-base bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 disabled:opacity-40 font-bold rounded-xl"
              >
                {totalQuantity > 0 ? "Lanjut ke Checkout" : seatMap ? "Pilih Kursi Dahulu" : "Pilih Tiket Dahulu"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title}
      />
    </div>
  );
}
