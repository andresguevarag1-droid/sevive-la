/**
 * Capa de datos del detalle de evento (/agenda/[slug]).
 * Devuelve null si no existe o Sanity falla (→ 404 en la página).
 */
import "server-only";
import type { PortableTextBlock } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { Story } from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";
import {
  eventoToStory,
  type RawEvento,
  type SanityImage,
} from "@/lib/sanity/queries";

export type EventoDetalle = {
  id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  inicio: string;
  fin?: string;
  horaPorConfirmar?: boolean;
  lugar?: string;
  descripcion?: string;
  cuerpo?: PortableTextBlock[];
  imagen?: string;
  imagenAlt?: string;
  enlace?: string;
  precioDesde?: string;
  organizador?: string;
  mapaUrl?: string;
};

type RawEventoDetalle = {
  _id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  inicio: string;
  fin?: string;
  horaPorConfirmar?: boolean;
  lugar?: string;
  descripcion?: string;
  cuerpo?: PortableTextBlock[];
  imagen?: (SanityImage & { alt?: string }) | null;
  enlace?: string;
  precioDesde?: string;
  organizador?: string;
  mapaUrl?: string;
};

export async function getEvento(slug: string): Promise<EventoDetalle | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawEventoDetalle | null>(
      /* groq */ `*[_type == "evento" && slug.current == $slug][0]{
        _id, title, "slug": slug.current, vertical, inicio, fin, horaPorConfirmar,
        lugar, descripcion, cuerpo, imagen{ asset, "alt": alt },
        enlace, precioDesde, organizador, mapaUrl
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
      inicio: raw.inicio,
      fin: raw.fin,
      horaPorConfirmar: raw.horaPorConfirmar,
      lugar: raw.lugar,
      descripcion: raw.descripcion,
      cuerpo: raw.cuerpo,
      imagen: urlForImage(raw.imagen, 1400),
      imagenAlt: raw.imagen?.alt || raw.title,
      enlace: raw.enlace,
      precioDesde: raw.precioDesde,
      organizador: raw.organizador,
      mapaUrl: raw.mapaUrl,
    };
  } catch (err) {
    console.error(`[sanity] evento "${slug}" falló:`, err);
    return null;
  }
}

/** Próximos eventos de la misma vertical (excluyendo el actual). */
export async function getEventosRelacionados(
  vertical: VerticalSlug,
  excluirId: string
): Promise<Story[]> {
  if (!sanityConfigured) return [];
  try {
    const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const raw = await client.fetch<RawEvento[]>(
      /* groq */ `*[_type == "evento" && vertical == $vertical && _id != $excluirId && defined(inicio) && inicio >= $desde] | order(inicio asc)[0...3]{
        _id, title, vertical, inicio, lugar, imagen, "slug": slug.current, horaPorConfirmar
      }`,
      { vertical, excluirId, desde },
      { next: { revalidate: 300 } }
    );
    return (raw ?? []).map(eventoToStory);
  } catch (err) {
    console.error("[sanity] eventos relacionados fallaron:", err);
    return [];
  }
}
