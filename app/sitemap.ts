import type { MetadataRoute } from "next";
import { site, verticals } from "@/lib/site";
import { getDinamicasAbiertas } from "@/lib/sanity/dinamica";
import { getCampanaActiva } from "@/lib/sanity/campana";
import { getEventosProximos } from "@/lib/sanity/listados";

/**
 * Sitemap: rutas estáticas + verticales + dinámicas abiertas.
 * Las páginas de detalle de contenido se agregan en V1.1.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();

  const estaticas: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: ahora, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/agenda`, lastModified: ahora, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/dinamicas`, lastModified: ahora, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/videos`, lastModified: ahora, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/promociones`, lastModified: ahora, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/comunidad`, lastModified: ahora, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/marcas`, lastModified: ahora, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/nosotros`, lastModified: ahora, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/legal/privacidad`, lastModified: ahora, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/legal/terminos`, lastModified: ahora, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/legal/cookies`, lastModified: ahora, changeFrequency: "yearly", priority: 0.2 },
  ];

  const deVerticales: MetadataRoute.Sitemap = verticals.map((v) => ({
    url: `${site.url}/${v.slug}`,
    lastModified: ahora,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Dinámicas abiertas (si Sanity falla, devuelve [] y el sitemap no revienta).
  const [dinamicas, campana, eventos] = await Promise.all([
    getDinamicasAbiertas(),
    getCampanaActiva(),
    getEventosProximos(),
  ]);
  const deEventos: MetadataRoute.Sitemap = eventos
    .filter((e) => e.href)
    .map((e) => ({
      url: `${site.url}${e.href}`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  const deDinamicas: MetadataRoute.Sitemap = dinamicas.map((d) => ({
    url: `${site.url}/dinamicas/${d.slug}`,
    lastModified: ahora,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const deCampana: MetadataRoute.Sitemap = campana
    ? [
        {
          url: `${site.url}/dinamicas/${campana.slug}`,
          lastModified: ahora,
          changeFrequency: "daily",
          priority: 0.9,
        },
      ]
    : [];

  return [...estaticas, ...deVerticales, ...deDinamicas, ...deCampana, ...deEventos];
}
