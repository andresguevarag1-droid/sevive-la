/**
 * Capa de datos del detalle de crónica (/cronica/[slug]).
 * Devuelve null si no existe o Sanity falla (→ 404 en la página).
 */
import "server-only";
import type { PortableTextBlock } from "@portabletext/types";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { Story } from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";
import {
  cronicaToStory,
  type RawCronica,
  type SanityImage,
} from "@/lib/sanity/queries";

export type CronicaDetalle = {
  id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  bajada?: string;
  autor?: string;
  formato?: string;
  lecturaMin?: number;
  fecha: string;
  imagen?: string;
  imagenAlt?: string;
  cuerpo?: PortableTextBlock[];
};

type RawCronicaDetalle = {
  _id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  bajada?: string;
  autor?: string;
  formato?: string;
  lecturaMin?: number;
  fecha: string;
  imagen?: (SanityImage & { alt?: string }) | null;
  cuerpo?: PortableTextBlock[];
};

export async function getCronica(slug: string): Promise<CronicaDetalle | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawCronicaDetalle | null>(
      /* groq */ `*[_type == "cronica" && slug.current == $slug][0]{
        _id, title, "slug": slug.current, vertical, bajada, autor, formato,
        lecturaMin, fecha, imagen{ asset, "alt": alt }, cuerpo
      }`,
      { slug },
      { next: { revalidate: 300 } }
    );
    if (!raw) return null;
    return {
      id: raw._id,
      title: raw.title,
      slug: raw.slug,
      vertical: raw.vertical,
      bajada: raw.bajada,
      autor: raw.autor,
      formato: raw.formato,
      lecturaMin: raw.lecturaMin,
      fecha: raw.fecha,
      imagen: urlForImage(raw.imagen, 1600),
      imagenAlt: raw.imagen?.alt || raw.title,
      cuerpo: raw.cuerpo,
    };
  } catch (err) {
    console.error(`[sanity] crónica "${slug}" falló:`, err);
    return null;
  }
}

/** Otras crónicas de la misma vertical (para el bloque "Seguí leyendo"). */
export async function getCronicasRelacionadas(
  vertical: VerticalSlug,
  excluirId: string
): Promise<Story[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<RawCronica[]>(
      /* groq */ `*[_type == "cronica" && vertical == $vertical && _id != $excluirId && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...3]{
        _id, title, vertical, bajada, autor, formato, lecturaMin, imagen, "slug": slug.current
      }`,
      { vertical, excluirId },
      { next: { revalidate: 300 } }
    );
    return (raw ?? []).map(cronicaToStory);
  } catch (err) {
    console.error("[sanity] crónicas relacionadas fallaron:", err);
    return [];
  }
}

/** Slugs y fechas de las crónicas publicadas (sitemap). */
export async function getCronicasParaSitemap(): Promise<
  { slug: string; fecha: string }[]
> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<{ slug: string; fecha: string }[]>(
      /* groq */ `*[_type == "cronica" && defined(slug.current) && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...100]{
        "slug": slug.current, fecha
      }`,
      {},
      { next: { revalidate: 3600 } }
    );
    return raw ?? [];
  } catch {
    return [];
  }
}
