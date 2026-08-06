import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El Studio, los endpoints y el panel interno no son contenido indexable.
        disallow: ["/studio", "/api/", "/admin/", "/mi-cupon/", "/ingest/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
