/**
 * Detalle de lugar (restaurante, bar, destino, sitio cultural…).
 * El esquema existía a medias: editable en el Studio pero sin página.
 * Esta capa lo activa: /lugares/<slug> + eventos próximos en ese lugar.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { VerticalSlug } from "@/lib/site";
import type { SanityImage } from "@/lib/sanity/queries";
import { eventoToStory, type RawEvento } from "@/lib/sanity/queries";
import type { Story } from "@/lib/content";

type RawLugarDetalle = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  ubicacion?: string;
  descripcion?: string;
  imagen?: SanityImage & { alt?: string };
  mapsUrl?: string;
  slug?: string;
};

export type LugarDetalle = {
  id: string;
  title: string;
  vertical: VerticalSlug;
  ubicacion?: string;
  descripcion?: string;
  imagen?: string;
  imagenAlt?: string;
  mapsUrl?: string;
  slug: string;
};

export async function getLugar(slug: string): Promise<LugarDetalle | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawLugarDetalle | null>(
      /* groq */ `*[_type == "lugar" && slug.current == $slug][0]{
        _id, title, vertical, ubicacion, descripcion, mapsUrl,
        imagen{ ..., "alt": alt }, "slug": slug.current
      }`,
      { slug },
      { next: { revalidate: 300 } }
    );
    if (!raw?.slug) return null;
    return {
      id: raw._id,
      title: raw.title,
      vertical: raw.vertical,
      ubicacion: raw.ubicacion,
      descripcion: raw.descripcion,
      imagen: urlForImage(raw.imagen, 1400),
      imagenAlt: raw.imagen?.alt,
      mapsUrl: raw.mapsUrl,
      slug: raw.slug,
    };
  } catch (err) {
    console.error("[sanity] lugar falló:", err);
    return null;
  }
}

/** Eventos próximos cuyo campo "lugar" menciona este sitio. */
export async function getEventosEnLugar(nombre: string): Promise<Story[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<RawEvento[]>(
      /* groq */ `*[_type == "evento" && defined(inicio) && inicio >= now() && lugar match $nombre]
        | order(inicio asc)[0...6]{
        _id, title, vertical, inicio, lugar, imagen, "slug": slug.current, horaPorConfirmar
      }`,
      { nombre: `${nombre}*` },
      { next: { revalidate: 300 } }
    );
    return (raw ?? []).map(eventoToStory);
  } catch (err) {
    console.error("[sanity] eventos en lugar fallaron:", err);
    return [];
  }
}
