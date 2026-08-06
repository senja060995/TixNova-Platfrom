import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaSetup } from "@/components/pwa/PwaSetup";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TixNova - Temukan Konser Terbaik di Kotamu",
  description: "Platform ticketing konser modern. Beli tiket konser favoritmu dengan mudah, aman, dan cepat.",
  keywords: ["konser", "tiket", "event", "musik", "hiburan", "indonesia"],
  authors: [{ name: "PT Ragam Manfaat Sinergi" }],
  openGraph: {
    title: "TixNova - Temukan Konser Terbaik di Kotamu",
    description: "Platform ticketing konser modern. Beli tiket konser favoritmu dengan mudah, aman, dan cepat.",
    type: "website",
    locale: "id_ID",
    siteName: "TixNova",
  },
  twitter: {
    card: "summary_large_image",
    title: "TixNova - Temukan Konser Terbaik di Kotamu",
    description: "Platform ticketing konser modern. Beli tiket konser favoritmu dengan mudah, aman, dan cepat.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <PwaSetup />
      </body>
    </html>
  );
}
