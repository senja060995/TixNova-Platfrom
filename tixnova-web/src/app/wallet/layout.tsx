import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Dompet Tiket - TixNova",
  description: "Dompet tiket konser digital. Simpan dan tunjukkan QR check-in dengan mudah.",
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function WalletLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-dvh flex flex-col bg-bg-base text-text-primary">{children}</div>;
}
