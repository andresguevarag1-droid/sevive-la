import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * PWA instalable: íconos PNG reales (192/512 + maskable) — con solo el SVG,
 * Chrome no ofrecía "Agregar a inicio" con ícono correcto.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2fb",
    theme_color: "#a190d2",
    lang: "es-CR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
