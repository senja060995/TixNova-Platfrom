"use client";

import { useState, useEffect } from "react";
import {
  Menu, X, MapPin, LogOut, User, CreditCard,
  Ticket, ChevronDown, BookOpen, Grid, LayoutDashboard, Heart
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";

export function Navbar() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const isUserAuthenticated = mounted && isAuthenticated;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  const rawRole = user?.role || user?.roles?.[0];
  const userRole = typeof rawRole === "string" ? rawRole : undefined;
  const dashboardHref = userRole === "super_admin"
    ? "/dashboard/admin-overview"
    : (userRole === "promotor" ? "/dashboard/overview" : "/dashboard/my-tickets");

  const profileMenuItems = [
    { label: t("nav.dashboard"), icon: LayoutDashboard, href: dashboardHref },
    { label: t("nav.myTickets"), icon: Ticket, href: "/dashboard/my-tickets" },
    { label: t("nav.profile"), icon: User, href: "/dashboard/profile" },
    { label: t("nav.history"), icon: CreditCard, href: "/dashboard/history" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-bg-border">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/TN.png"
              alt="TixNova Logo"
              className="h-11 md:h-12 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="text-xl md:text-2xl font-black tracking-tight text-white">
              Tix<span className="text-primary">Nova</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-text-secondary hover:text-primary transition-colors font-medium text-sm">
              {t("nav.events")}
            </Link>
            <Link href="/categories" className="text-text-secondary hover:text-primary transition-colors font-medium text-sm">
              {t("nav.categories")}
            </Link>
            <Link href="/cities" className="text-text-secondary hover:text-primary transition-colors font-medium text-sm">
              {t("nav.cities")}
            </Link>
            <Link href="/communities" className="text-text-secondary hover:text-primary transition-colors font-medium text-sm">
              Komunitas
            </Link>
            <Link href="/blogs" className="text-text-secondary hover:text-primary transition-colors font-medium text-sm">
              {t("nav.blog")}
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isUserAuthenticated ? (
              <>
                {/* Dedicated Ticket Icon Button for Logged-In User */}
                <Link
                  href="/dashboard/my-tickets"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                  title={t("nav.myTickets")}
                >
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline">{t("nav.myTickets")}</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-bg-surface border border-bg-border hover:border-primary/50 transition-all"
                    aria-expanded={isProfileOpen}
                  >
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-extrabold text-sm shadow">
                      {user?.name?.[0] || "U"}
                    </div>
                    <span className="text-xs font-bold text-white hidden md:block max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform", isProfileOpen && "rotate-180")} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-bg-surface border border-bg-border rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-bg-border bg-bg-elevated/40">
                        <p className="font-bold text-white text-sm">{user?.name}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        {userRole && (
                          <span className="inline-block px-2 py-0.5 mt-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                            {userRole}
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        {profileMenuItems.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs text-text-secondary hover:text-white hover:bg-bg-elevated transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-primary" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-bg-border pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs text-danger hover:bg-danger/10 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("nav.logout")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest Auth Buttons */
              <div className="flex items-center gap-2">
                <Link href="/promotor" className="hidden sm:inline-flex btn-outline text-xs font-bold py-2 px-3">
                  {t("nav.promoter")}
                </Link>
                <Link href="/login" className="btn-ghost text-xs font-bold py-2 px-3">
                  {t("nav.login")}
                </Link>
                <Link href="/register" className="btn-primary text-xs font-bold py-2 px-4 shadow-md shadow-primary/20">
                  {t("nav.register")}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-bg-surface border border-bg-border text-text-primary"
              aria-label="Buka menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xs bg-bg-surface border-l border-bg-border shadow-2xl animate-slide-in flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-bg-border">
              <span className="font-bold text-white text-sm">{t("nav.navigation")}</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-xl hover:bg-bg-elevated text-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-white text-sm transition-colors">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("nav.events")}</span>
              </Link>
              <Link href="/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-white text-sm transition-colors">
                <Grid className="w-4 h-4 text-primary" />
                <span>{t("nav.categories")}</span>
              </Link>
              <Link href="/cities" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-white text-sm transition-colors">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("nav.cities")}</span>
              </Link>
              <Link href="/communities" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-white text-sm transition-colors">
                <Heart className="w-4 h-4 text-primary" />
                <span>Komunitas</span>
              </Link>
              <Link href="/blogs" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-elevated hover:text-white text-sm transition-colors">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>{t("nav.blog")}</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-bg-border space-y-3 bg-bg-elevated/30">
              {isUserAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-4 py-3 bg-bg-surface border border-bg-border rounded-xl">
                    <p className="font-bold text-white text-sm">{user?.name}</p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-text-secondary hover:bg-bg-surface hover:text-white text-xs transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-primary" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-danger hover:bg-danger/10 text-xs transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/promotor" onClick={() => setIsMobileMenuOpen(false)} className="btn-outline w-full justify-center text-xs py-2.5">
                    {t("nav.promoter")}
                  </Link>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-secondary w-full justify-center text-xs py-2.5">
                    {t("nav.login")}
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary w-full justify-center text-xs py-2.5">
                    {t("nav.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}