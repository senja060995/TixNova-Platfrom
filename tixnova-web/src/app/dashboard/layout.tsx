"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  QrCode,
  ShoppingBag,
  Ticket,
  CheckCircle,
  FileText,
  LogOut,
  Building2,
  Menu,
  X,
  User as UserIcon,
  BarChart2,
  Percent,
  BookOpen,
  Gift,
  Heart,
  RotateCcw,
  CalendarClock,
  Megaphone,
  Users,
  Handshake,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Wrench,
  Code2,
  ChevronDown,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

import { useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  tenant?: {
    name: string;
    slug: string;
    status?: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Collapsible groups state (key: group index, value: boolean isExpanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    authApi
      .getMe()
      .then((res) => {
        const u = res.data.user;
        const r = res.data.roles || [];
        setUser(u);
        setRoles(r);

        const isSuperAdminUser = r.includes("super_admin");
        const isPromotorUser = r.includes("promotor");

        // Block unapproved promotor from accessing dashboard
        if (isPromotorUser && u.tenant && u.tenant.status !== "active") {
          toast.warning(
            "Mohon maaf, proses pendaftaran promotor Anda sedang diproses oleh pihak admin. Mohon ditunggu beberapa saat lagi, nanti akan diberitahukan lewat email setelah proses pendaftaran berhasil diaudit.",
            { title: "Akses Belum Disetujui", duration: 8000 }
          );
          authApi.clearTokens();
          router.replace("/login");
          return;
        }

        // Redirect regular user away from promotor overview
        if (
          !isSuperAdminUser &&
          !isPromotorUser &&
          (pathname === "/dashboard/overview" || pathname === "/dashboard")
        ) {
          router.replace("/dashboard/my-tickets");
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.success("Berhasil logout.");
      router.push("/login");
    } catch {
      authApi.clearTokens();
      router.push("/login");
    }
  };

  const isSuperAdmin = roles.includes("super_admin");
  const isPromotor = roles.includes("promotor");

  // Grouped Navigation Items
  const navGroups: NavGroup[] = isSuperAdmin
    ? [
        {
          groupTitle: "Dasbor & Operasional",
          items: [
            { label: t("dashboard.overview"), href: "/dashboard/admin-overview", icon: LayoutDashboard },
            { label: t("dashboard.tenantsTitle"), href: "/dashboard/tenants", icon: Building2 },
            { label: t("dashboard.approvalsTitle"), href: "/dashboard/approvals", icon: CheckCircle },
            { label: "Ubah Jadwal", href: "/dashboard/event-reschedules", icon: CalendarClock },
            { label: t("dashboard.eventsTitle"), href: "/dashboard/admin-events", icon: Calendar },
            { label: "Semua Transaksi", href: "/dashboard/transactions", icon: ShoppingBag },
          ],
        },
        {
          groupTitle: "Keuangan & Affiliate",
          items: [
            { label: t("dashboard.reportsTitle"), href: "/dashboard/admin-reports", icon: BarChart2 },
            { label: "Komisi Platform", href: "/dashboard/commission", icon: Percent },
            { label: "Affiliate & Distribusi", href: "/dashboard/affiliates", icon: Handshake },
            { label: "Trust Ledger", href: "/dashboard/trust", icon: ShieldCheck },
            { label: "Withdrawal Promotor", href: "/dashboard/withdrawals", icon: Wallet },
          ],
        },
        {
          groupTitle: "Konten & Layanan",
          items: [
            { label: t("dashboard.blogsTitle"), href: "/dashboard/admin-blogs", icon: FileText },
            { label: t("dashboard.refundsTitle"), href: "/dashboard/admin-refunds", icon: RotateCcw },
          ],
        },
      ]
    : isPromotor
    ? [
        {
          groupTitle: "Dasbor & Event",
          items: [
            { label: t("dashboard.overview"), href: "/dashboard/overview", icon: LayoutDashboard },
            { label: t("dashboard.eventsTitle"), href: "/dashboard/events", icon: Calendar },
            { label: "Pesanan Masuk", href: "/dashboard/orders", icon: ShoppingBag },
            { label: t("dashboard.reportsTitle"), href: "/dashboard/reports", icon: BarChart2 },
            { label: t("dashboard.scanTitle"), href: "/dashboard/scan", icon: QrCode },
            { label: "Saldo & Tarik Dana", href: "/dashboard/withdraw", icon: Wallet },
          ],
        },
        {
          groupTitle: "Growth & Komunitas",
          items: [
            { label: "Campaign OS", href: "/dashboard/campaigns", icon: Megaphone },
            { label: "Event CRM", href: "/dashboard/crm", icon: Users },
            { label: "Komunitas", href: "/dashboard/communities", icon: Heart },
            { label: "AI Pricing", href: "/dashboard/pricing", icon: TrendingUp },
            { label: "Sponsor OS", href: "/dashboard/sponsors", icon: Handshake },
          ],
        },
        {
          groupTitle: "Ekosistem & Ops",
          items: [
            { label: "Vendor OS", href: "/dashboard/vendors", icon: Wrench },
            { label: "Developer API", href: "/dashboard/api", icon: Code2 },
            { label: t("dashboard.blogsTitle"), href: "/dashboard/blog", icon: BookOpen },
            { label: t("dashboard.refundsTitle"), href: "/dashboard/promotor-refunds", icon: RotateCcw },
          ],
        },
      ]
    : [
        {
          groupTitle: "Tiket & Transaksi",
          items: [
            { label: t("dashboard.myTicketsTitle"), href: "/dashboard/my-tickets", icon: Ticket },
            { label: "Dompet Tiket", href: "/wallet", icon: Wallet },
            { label: t("dashboard.historyTitle"), href: "/dashboard/history", icon: ShoppingBag },
          ],
        },
        {
          groupTitle: "Layanan & Program",
          items: [
            { label: t("dashboard.refundsTitle"), href: "/dashboard/refunds", icon: RotateCcw },
            { label: t("dashboard.referralsTitle"), href: "/dashboard/referrals", icon: Gift },
            { label: "Komunitas Saya", href: "/dashboard/my-communities", icon: Heart },
          ],
        },
      ];

  const roleBadgeLabel = isSuperAdmin ? "Super Admin" : isPromotor ? "Promotor / EO" : "Pembeli Tiket";

  return (
    <div className="min-h-screen bg-bg-base flex text-text-primary">
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-surface border-r border-bg-border fixed inset-y-0 z-30 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-bg-border/60">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-black text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TN.png" alt="TixNova Logo" className="h-9 w-auto object-contain shrink-0" />
            <span>
              Tix<span className="text-primary">Nova</span>
            </span>
          </Link>
        </div>

        {/* Collapsible Menu Groups */}
        <nav className="flex-1 p-4 space-y-4">
          {navGroups.map((group, groupIdx) => {
            const isExpanded = expandedGroups[groupIdx] ?? true;

            return (
              <div key={group.groupTitle} className="space-y-1">
                {/* Group Header (Clickable to Expand/Collapse) */}
                <button
                  type="button"
                  onClick={() => toggleGroup(groupIdx)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-text-muted hover:text-white transition-colors group"
                >
                  <span>{group.groupTitle}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-transform duration-200" />
                  )}
                </button>

                {/* Group Nav Items */}
                {isExpanded && (
                  <div className="space-y-1 pl-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            isActive
                              ? "bg-primary text-white font-bold shadow-md shadow-primary/25 translate-x-0.5"
                              : "text-text-secondary hover:text-white hover:bg-bg-elevated"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-text-muted"}`} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-bg-surface border-b border-bg-border sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-secondary">
              {t("dashboard.welcome")}{user ? `, ${user.name}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* Top Header User Profile & Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-bg-elevated border border-bg-border hover:border-primary/50 transition-all text-left shadow-sm"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                    <span className="text-[11px] text-text-muted truncate max-w-[160px]">{user.email}</span>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-dark border border-primary/40 flex items-center justify-center text-white font-black text-sm shadow-md">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${profileDropdownOpen ? "rotate-180 text-white" : ""}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-bg-surface border border-bg-border rounded-2xl shadow-2xl p-2 z-50 animate-fadeInScale">
                    {/* User Card Header */}
                    <div className="p-3 border-b border-bg-border/60 bg-bg-elevated/40 rounded-xl mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-dark flex items-center justify-center text-white font-black text-base shadow-md">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <p className="text-xs text-text-muted truncate">{user.email}</p>
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3" /> {roleBadgeLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu */}
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-primary" />
                      <span>{t("dashboard.profileTitle")}</span>
                    </Link>

                    {/* Logout Option */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-danger hover:bg-danger/10 transition-colors mt-1 border-t border-bg-border/60 pt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-bg-surface border-b border-bg-border sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2 text-lg font-black text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TN.png" alt="TixNova Logo" className="h-7 w-auto object-contain shrink-0" />
            <span>
              Tix<span className="text-primary">Nova</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-bg-elevated border border-bg-border text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Dashboard Footer */}
        <footer className="px-8 py-4 border-t border-bg-border/40 text-center text-xs text-text-muted">
          © {new Date().getFullYear()} TixNova by RamsDev. All rights reserved.
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-72 bg-bg-surface border-r border-bg-border p-6 flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-bg-border">
              <Link href="/" className="flex items-center gap-2 text-lg font-black text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/TN.png" alt="TixNova Logo" className="h-7 w-auto object-contain shrink-0" />
                <span>
                  Tix<span className="text-primary">Nova</span>
                </span>
              </Link>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-elevated text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Profile Card */}
            {user && (
              <div className="p-3 bg-bg-elevated border border-bg-border rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Collapsible Navigation Groups */}
            <nav className="flex-1 space-y-4">
              {navGroups.map((group, groupIdx) => {
                const isExpanded = expandedGroups[groupIdx] ?? true;

                return (
                  <div key={group.groupTitle} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupIdx)}
                      className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-text-muted"
                    >
                      <span>{group.groupTitle}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-1 pl-1">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href;
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                                isActive
                                  ? "bg-primary text-white font-bold"
                                  : "text-text-secondary hover:text-white hover:bg-bg-elevated"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-bg-border pt-4 mt-6">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

