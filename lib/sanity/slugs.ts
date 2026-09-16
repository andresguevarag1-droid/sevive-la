/**
 * Slugs publicados por tipo — alimenta generateStaticParams: cada detalle
 * se prerenderiza en el build y un slug nuevo cae a render on-demand (ISR).
 * Si Sanity no responde en el build, devuelve [] y todo sigue dinámico.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";

export async function getSlugsDeTipo(
  tipo: "cronica" | "evento" | "beneficio" | "dinamica" | "lugar"
): Promise<{ slug: string }[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<string[]>(
      // Las crónicas programadas (fecha futura) no se prerenderizan: aún
      // no están publicadas.
      /* groq */ `*[_type == $tipo && defined(slug.current) &&
        (_type != "cronica" || !defined(fecha) || fecha <= now())][0...200].slug.current`,
      { tipo },
      { next: { revalidate: 3600 } }
    );
    return (raw ?? []).map((slug) => ({ slug }));
  } catch (err) {
    console.error(`[sanity] slugs de ${tipo} fallaron (build seguirá dinámico):`, err);
    return [];
  }
}

/**
 * Fecha de última edición real (_updatedAt) de UN documento por slug, para
 * el `dateModified` de su JSON-LD. Consulta liviana aparte (no toca las
 * queries de contenido existentes).
 */
export async function getUltimaEdicion(
  tipo: "cronica" | "evento" | "beneficio" | "dinamica" | "lugar" | "campana",
  slug: string
): Promise<string | undefined> {
  if (!sanityConfigured) return undefined;
  try {
    return (
      (await client.fetch<string | null>(
        /* groq */ `*[_type == $tipo && slug.current == $slug][0]._updatedAt`,
        { tipo, slug },
        { next: { revalidate: 300 } }
      )) ?? undefined
    );
  } catch (err) {
    console.error(`[sanity] última edición de ${tipo}/${slug} falló:`, err);
    return undefined;
  }
}

/**
 * Mapa slug → fecha de última edición real (_updatedAt de Sanity), para el
 * `lastModified` del sitemap. Función aparte y liviana (no toca las queries
 * de contenido existentes): así el freshness signal se puede sumar a
 * cualquier tipo sin rehacer sus tipos/queries.
 */
export async function getUltimaEdicionPorTipo(
  tipo: "cronica" | "evento" | "beneficio" | "dinamica" | "lugar" | "campana"
): Promise<Record<string, string>> {
  if (!sanityConfigured) return {};
  try {
    const raw = await client.fetch<{ slug: string; updatedAt: string }[]>(
      /* groq */ `*[_type == $tipo && defined(slug.current)][0...200]{
        "slug": slug.current, "updatedAt": _updatedAt
      }`,
      { tipo },
      { next: { revalidate: 3600 } }
    );
    return Object.fromEntries((raw ?? []).map((r) => [r.slug, r.updatedAt]));
  } catch (err) {
    console.error(`[sanity] última edición de ${tipo} falló:`, err);
    return {};
  }
}
