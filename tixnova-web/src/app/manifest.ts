import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TixNova - Dompet Tiket",
    short_name: "TixNova",
    description: "Dompet tiket konser digital. Simpan, tunjukkan QR, dan kelola tiketmu dalam satu aplikasi.",
    id: "/wallet",
    start_url: "/wallet",
    scope: "/",
    display: "standalone",
    background_color: "#0F0F17",
    theme_color: "#7C3AED",
    categories: ["entertainment"],
    lang: "id",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/screenshot-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Dompet tiket & QR check-in",
      },
      {
        src: "/screenshots/screenshot-wide.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Jelajahi event favoritmu",
      },
    ],
    shortcuts: [
      {
        name: "Dompet Tiket",
        short_name: "Dompet",
        description: "Lihat tiket & QR check-in",
        url: "/wallet",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Jelajahi Event",
        short_name: "Event",
        description: "Cari konser terbaru",
        url: "/events",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
