import type { MetadataRoute } from "next";
import { site, verticalsVisibles } from "@/lib/site";
import { getDinamicasAbiertas } from "@/lib/sanity/dinamica";
import { getCampanaActiva } from "@/lib/sanity/campana";
import { getEventosProximos, getBeneficiosTodos } from "@/lib/sanity/listados";
import { getCronicasParaSitemap } from "@/lib/sanity/cronica";
import { getSlugsDeTipo } from "@/lib/sanity/slugs";

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
  const [dinamicas, campana, eventos, cronicas, beneficios, lugares] = await Promise.all([
    getDinamicasAbiertas(),
    getCampanaActiva(),
    getEventosProximos(),
    getCronicasParaSitemap(),
    getBeneficiosTodos(),
    getSlugsDeTipo("lugar"),
  ]);
  const deCronicas: MetadataRoute.Sitemap = cronicas.map((c) => ({
    url: `${site.url}/cronica/${c.slug}`,
    lastModified: new Date(c.fecha),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  const deEventos: MetadataRoute.Sitemap = eventos
    .filter((e) => e.href)
    .map((e) => ({
      url: `${site.url}${e.href}`,
     
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  // Las páginas de conversión comercial también se indexan.
  const deBeneficios: MetadataRoute.Sitemap = beneficios
    .filter((b) => b.href)
    .map((b) => ({
      url: `${site.url}${b.href}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  const deDinamicas: MetadataRoute.Sitemap = dinamicas.map((d) => ({
    url: `${site.url}/dinamicas/${d.slug}`,
   
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
