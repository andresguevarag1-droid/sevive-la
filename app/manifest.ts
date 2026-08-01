import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** PWA-lite: instalable, con los colores del sistema de diseño (tema claro). */
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
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
