"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart, Shield, Zap } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

// Social media SVG icons (removed from lucide-react)
const FacebookIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>);
const TwitterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const InstagramIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>);
const YoutubeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>);

const socialLinks = [
  { icon: FacebookIcon, href: "https://facebook.com/tixnova", label: "Facebook" },
  { icon: TwitterIcon, href: "https://twitter.com/tixnova", label: "Twitter" },
  { icon: InstagramIcon, href: "https://instagram.com/tixnova", label: "Instagram" },
  { icon: YoutubeIcon, href: "https://youtube.com/tixnova", label: "YouTube" },
];

export function Footer() {
  const { t } = useLocale();
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const footerLinks = {
    platform: [
      { label: t("nav.events"), href: "/events" },
      { label: t("nav.categories"), href: "/events?category=all" },
      { label: t("nav.cities"), href: "/events?city=all" },
      { label: t("nav.blog"), href: "/blogs" },
      { label: "Cara Beli Tiket", href: "/help/how-to-buy" },
    ],
    support: [
      { label: "Bantuan", href: "/help" },
      { label: "FAQ", href: "/help/faq" },
      { label: "Kebijakan Refund", href: "/help/refund-policy" },
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Kebijakan Privasi", href: "/privacy" },
    ],
    company: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Karir", href: "/careers" },
      { label: "Media", href: "/press" },
      { label: "Mitra", href: "/partners" },
      { label: "Hubungi Kami", href: "/contact" },
    ],
    promotor: [
      { label: t("nav.promoter"), href: "/promotor" },
      { label: "Dashboard Promotor", href: "/dashboard/overview" },
      { label: "Panduan Buat Event", href: "/promotor/guide" },
      { label: "Komisi & Biaya", href: "/promotor/fees" },
      { label: "Scanner Tiket", href: "/dashboard/scan" },
    ],
  };

  return (
    <footer className="bg-bg-surface border-t border-bg-border">
      <div className="container-main py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6" aria-label="TixNova Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/TN.png"
                alt="TixNova Logo"
                className="h-12 md:h-14 w-auto object-contain shrink-0"
              />
              <span className="text-2xl md:text-3xl font-black text-white">Tix<span className="text-primary">Nova</span></span>
            </Link>
            <p className="text-text-secondary text-base mb-6 max-w-xs">
              {t("footer.description")}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Platform">
            <h3 className="font-semibold text-text-primary mb-4">{t("footer.platform")}</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Bantuan">
            <h3 className="font-semibold text-text-primary mb-4">{t("footer.support")}</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Perusahaan">
            <h3 className="font-semibold text-text-primary mb-4">{t("footer.company")}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Promotor">
            <h3 className="font-semibold text-text-primary mb-4">{t("footer.promoter")}</h3>
            <ul className="space-y-3">
              {footerLinks.promotor.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-text-secondary hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 pt-8 border-t border-bg-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm" suppressHydrationWarning>
              © {currentYear} TixNova by RamsDev. {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-6 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                {t("footer.secure")}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                {t("footer.fast")}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-danger" />
                {t("footer.madeIn")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
