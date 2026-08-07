"use client";

import { useState, useEffect, Suspense, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  Wallet,
  ChevronLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface CartItem {
  ticket: {
    id: number;
    name: string;
    type: string;
    price: number;
  };
  quantity: number;
  seat_ids?: number[];
}

interface CartData {
  event: {
    id: number;
    slug: string;
    title: string;
    venue: string;
    city: string;
    start_date: string;
    banner?: string;
  };
  items: CartItem[];
  totalPrice: number;
}

const PAYMENT_METHODS = [
  { id: "qris", name: "QRIS (GoPay, OVO, Dana, LinkAja)", icon: QrCode, desc: "Instan & Bebas Biaya Admin Tambahan" },
  { id: "bank_transfer", name: "Virtual Account (BCA / Mandiri / BNI / BRI)", icon: Building2, desc: "Verifikasi Otomatis 24 Jam" },
  { id: "ewallet", name: "E-Wallet (GoPay, ShopeePay)", icon: Wallet, desc: "Pembayaran Langsung via Aplikasi" },
  { id: "stripe", name: "Kartu Kredit / Debit / Link (Stripe)", icon: CreditCard, desc: "Pembayaran Aman & Internasional via Stripe" },
  { id: "credit_card", name: "Kartu Kredit / Debit", icon: Lock, desc: "Visa, Mastercard, JCB" },
];

let cachedCart: CartData | null | undefined;

function getCartSnapshot(): CartData | null {
  if (typeof window === "undefined") return null;
  if (cachedCart === undefined) {
    try {
      const saved = localStorage.getItem("tixnova_cart");
      cachedCart = saved ? (JSON.parse(saved) as CartData) : null;
    } catch {
      cachedCart = null;
    }
  }
  return cachedCart;
}

function getServerCartSnapshot(): CartData | null {
  return null;
}

function subscribeCart(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function clearCartCache() {
  cachedCart = null;
}

function CheckoutContent() {
  const router = useRouter();

  const cart = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);

  // Buyer Form
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [submitting, setSubmitting] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [communityCode, setCommunityCode] = useState("");
  const profileRequested = useRef(false);

  useEffect(() => {
    if (!profileRequested.current && api.getAccessToken()) {
      profileRequested.current = true;
      api.getClient().get("/auth/me")
        .then((res) => {
          const u = res.data.data?.user || res.data.user;
          if (u) {
            setBuyerName((prev) => prev || u.name || "");
            setBuyerEmail((prev) => prev || u.email || "");
            setBuyerPhone((prev) => prev || u.phone || "");
          }
        })
        .catch(() => {});
    }
  }, []);

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Keranjang Kosong</h2>
          <p className="text-text-secondary text-sm mb-6">
            Kamu belum memilih tiket event apapun. Silakan pilih tiket terlebih dahulu.
          </p>
          <Link href="/events">
            <Button className="bg-primary hover:bg-primary-dark">Jelajahi Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart?.totalPrice || 0;
  const adminFee = 5000;
  const grandTotal = subtotal + adminFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!api.getAccessToken()) {
      toast.error("Silakan masuk terlebih dahulu untuk melanjutkan pembayaran.");
      router.push("/login?redirect=/checkout");
      return;
    }

    if (!buyerName || !buyerEmail || !buyerPhone || !cart) {
      toast.error("Lengkapi data pemesan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        event_id: cart.event.id,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        payment_method: paymentMethod,
        voucher_code: voucherInput.trim() || undefined,
        referral_code: referralCode.trim() || undefined,
        community_code: communityCode.trim() || undefined,
        items: cart.items.map((item) => ({
          ticket_id: item.ticket.id,
          quantity: item.quantity,
          attendees: Array(item.quantity).fill({
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone,
          }),
          seat_ids: item.seat_ids || [],
        })),
      };

      const orderResponse = await api.getClient().post("/orders", payload);
      const order = orderResponse.data.data;
      const paymentResponse = await api.getClient().post("/payments/initiate", {
        order_code: order.order_code,
      });
      const paymentUrl = paymentResponse.data.data.payment_url;

      if (!paymentUrl) {
        throw new Error("URL pembayaran tidak tersedia.");
      }

      localStorage.removeItem("tixnova_cart");
      clearCartCache();
      window.location.assign(paymentUrl);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gagal membuat order. Silakan coba lagi.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {!api.getAccessToken() && (
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            Pembayaran hanya tersedia untuk pengguna yang sudah masuk.
          </div>
        )}
        {/* Navigation back */}
        <div className="mb-6">
          <Link href={`/events`} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Detail Event
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-8">Checkout & Pembayaran Tiket</h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Buyer Details & Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Data Pemesan */}
            <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
              <div className="flex items-center gap-3 border-b border-bg-border pb-4">
                <div className="w-8 h-8 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center text-sm border border-primary/30">
                  1
                </div>
                <h3 className="text-xl font-bold text-white">Data Pemesan (Penerima E-Tiket)</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Nama Lengkap (Sesuai KTP/Passport)
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <Input
                      type="text"
                      placeholder="Budi Santoso"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <Input
                        type="email"
                        placeholder="budi@example.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Nomor WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <Input
                        type="tel"
                        placeholder="081234567890"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="pl-12 bg-bg-elevated border-bg-border text-white rounded-xl focus:border-primary py-3.5"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5 flex items-center gap-3 text-xs text-text-secondary">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <span>E-tiket resmi bertanda QR Code akan dikirim langsung ke email & WhatsApp di atas setelah pembayaran sukses.</span>
                </div>
              </div>
            </div>

{/* Step 2: Pilih Metode Pembayaran */}
            <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-bg-border space-y-6">
              <div className="flex items-center gap-3 border-b border-bg-border pb-4">
                <div className="w-8 h-8 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center text-sm border border-primary/30">
                  2
                </div>
                <h3 className="text-xl font-bold text-white">Metode Pembayaran</h3>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const selected = paymentMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                        selected
                          ? "bg-primary/15 border-primary shadow-md shadow-primary/10"
                          : "bg-bg-elevated border-bg-border hover:border-primary/40"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${selected ? "bg-primary text-white" : "bg-bg-surface text-text-muted"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm sm:text-base">{method.name}</h4>
                        <span className="text-xs text-text-muted">{method.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? "border-primary bg-primary text-white" : "border-bg-border"}`}>
                        {selected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Order Summary */}
          <div className="space-y-6">
            <div className="bg-bg-surface p-6 rounded-2xl border border-bg-border space-y-6 sticky top-24 shadow-xl">
              <h3 className="text-lg font-bold text-white border-b border-bg-border pb-4">Ringkasan Order</h3>

              {/* Event Mini Card */}
              <div className="flex gap-4 items-center border-b border-bg-border pb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-bg-border">
                  <Image
                    src={cart.event.banner || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600"}
                    alt={cart.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{cart.event.title}</h4>
                  <span className="text-xs text-text-secondary block">{cart.event.venue}, {cart.event.city}</span>
                  <span className="text-xs text-primary font-medium">{formatDate(cart.event.start_date)}</span>
                </div>
              </div>

              {/* Ticket Items List */}
              <div className="space-y-3 border-b border-bg-border pb-4">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider block">Tiket Dipesan</span>
                {cart.items.map((item) => (
                  <div key={item.ticket.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-bold text-white">{item.ticket.name}</span>
                      <span className="text-xs text-text-muted block">x{item.quantity} tiket</span>
                    </div>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(item.ticket.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Voucher Promo Form */}
              <div className="border-b border-bg-border pb-4 space-y-2">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider block">Kode Promo / Voucher</span>
                <Input
                  type="text"
                  placeholder="Contoh: TIX50K"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  className="bg-bg-elevated border-bg-border text-white text-xs uppercase font-mono py-2 w-full"
                />
                <p className="text-xs text-text-muted">Diskon dan total akhir divalidasi oleh server saat order dibuat.</p>
              </div>

              <div className="border-b border-bg-border pb-4 space-y-2">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider block">Kode Referral (Opsional)</span>
                <Input
                  type="text"
                  placeholder="Contoh: REF-ABCD1234"
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                  className="bg-bg-elevated border-bg-border text-white text-xs uppercase font-mono py-2 w-full"
                />
                <p className="text-xs text-text-muted">Komisi referral dihitung setelah pembayaran berhasil.</p>
              </div>

              <div className="border-b border-bg-border pb-4 space-y-2">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider block">Kode Komunitas (Opsional)</span>
                <Input
                  type="text"
                  placeholder="Contoh: KOMUNITAS"
                  value={communityCode}
                  onChange={(e) => setCommunityCode(e.target.value.toUpperCase())}
                  className="bg-bg-elevated border-bg-border text-white text-xs uppercase font-mono py-2 w-full"
                />
                <p className="text-xs text-text-muted">Gunakan kode komunitas untuk bergabung dan dapatkan revenue share.</p>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-sm border-b border-bg-border pb-4">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal Tiket</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Biaya Layanan / Admin</span>
                  <span className="text-white font-medium">{formatCurrency(adminFee)}</span>
                </div>

              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base">
                <span className="font-bold text-white">Total Pembayaran</span>
                <span className="text-xl font-extrabold text-primary">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Submit CTA Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-4 text-base font-bold bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 rounded-xl flex items-center justify-center gap-2"
              >
                {submitting ? "Membuat Order..." : (
                  <>
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base py-12 px-4 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-[400px] bg-bg-elevated rounded-2xl w-full" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
