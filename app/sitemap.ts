import type { MetadataRoute } from "next";
import { site, verticalsVisibles } from "@/lib/site";
import { getDinamicasAbiertas } from "@/lib/sanity/dinamica";
import { getCampanaActiva } from "@/lib/sanity/campana";
import { getEventosProximos, getBeneficiosTodos } from "@/lib/sanity/listados";
import { getCronicasParaSitemap } from "@/lib/sanity/cronica";
import { getSlugsDeTipo, getUltimaEdicionPorTipo } from "@/lib/sanity/slugs";

/**
 * Sitemap: rutas estáticas + verticales + dinámicas abiertas.
 * Las páginas de detalle de contenido se agregan en V1.1.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const estaticas: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/agenda`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/dinamicas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/videos`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/en-vivo`, changeFrequency: "daily", priority: 0.6 },
    { url: `${site.url}/capitulos`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/promociones`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site.url}/comunidad`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/marcas`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/nosotros`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site.url}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/legal/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const deVerticales: MetadataRoute.Sitemap = verticalsVisibles.map((v) => ({
    url: `${site.url}/${v.slug}`,
   
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Dinámicas abiertas (si Sanity falla, devuelve [] y el sitemap no revienta).
  const [
    dinamicas,
    campana,
    eventos,
    cronicas,
    beneficios,
    lugares,
    editadoEvento,
    editadoBeneficio,
    editadoDinamica,
    editadoLugar,
  ] = await Promise.all([
    getDinamicasAbiertas(),
    getCampanaActiva(),
    getEventosProximos(),
    getCronicasParaSitemap(),
    getBeneficiosTodos(),
    getSlugsDeTipo("lugar"),
    // "Última edición real" (_updatedAt) por tipo, para el freshness signal
    // del sitemap — no solo las crónicas, como antes.
    getUltimaEdicionPorTipo("evento"),
    getUltimaEdicionPorTipo("beneficio"),
    getUltimaEdicionPorTipo("dinamica"),
    getUltimaEdicionPorTipo("lugar"),
  ]);
  /** Último segmento del href ("/agenda/mi-slug" → "mi-slug"). */
  const slugDeHref = (href?: string) => href?.split("/").pop();

  const deCronicas: MetadataRoute.Sitemap = cronicas.map((c) => ({
    url: `${site.url}/cronica/${c.slug}`,
    lastModified: new Date(c.fecha),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const deEventos: MetadataRoute.Sitemap = eventos
    .filter((e) => e.href)
    .map((e) => {
      const editado = editadoEvento[slugDeHref(e.href) ?? ""];
      return {
        url: `${site.url}${e.href}`,
        ...(editado ? { lastModified: new Date(editado) } : {}),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  // Las páginas de conversión comercial también se indexan.
  const deBeneficios: MetadataRoute.Sitemap = beneficios
    .filter((b) => b.href)
    .map((b) => {
      const editado = editadoBeneficio[slugDeHref(b.href) ?? ""];
      return {
        url: `${site.url}${b.href}`,
        ...(editado ? { lastModified: new Date(editado) } : {}),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  const deDinamicas: MetadataRoute.Sitemap = dinamicas.map((d) => ({
    url: `${site.url}/dinamicas/${d.slug}`,
    ...(editadoDinamica[d.slug] ? { lastModified: new Date(editadoDinamica[d.slug]) } : {}),
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const deCampana: MetadataRoute.Sitemap = campana
    ? [
        {
          url: `${site.url}/dinamicas/${campana.slug}`,
          changeFrequency: "daily",
          priority: 0.9,
        },
      ]
    : [];

  // SEO local: cada lugar con página propia también se indexa.
  const deLugares: MetadataRoute.Sitemap = lugares.map((l) => ({
    url: `${site.url}/lugares/${l.slug}`,
    ...(editadoLugar[l.slug] ? { lastModified: new Date(editadoLugar[l.slug]) } : {}),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...estaticas,
    ...deBeneficios,
    ...deVerticales,
    ...deDinamicas,
    ...deCampana,
    ...deEventos,
    ...deCronicas,
    ...deLugares,
  ];
}
