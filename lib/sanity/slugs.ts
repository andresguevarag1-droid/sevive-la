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
