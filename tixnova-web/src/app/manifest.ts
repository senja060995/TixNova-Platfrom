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
    orientation: "portrait",
    background_color: "#0F0F17",
    theme_color: "#7C3AED",
    categories: ["entertainment", "tickets", "events"],
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
