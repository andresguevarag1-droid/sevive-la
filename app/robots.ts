import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El Studio y los endpoints no son contenido indexable.
        disallow: ["/studio", "/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
