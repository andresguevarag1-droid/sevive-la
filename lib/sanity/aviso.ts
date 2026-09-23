/**
 * Capa de datos del Aviso (hero de home sin dinámica/sorteo).
 * Se oculta si hay una campaña activa: esa manda primero (ver page.tsx).
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { SanityImage } from "@/lib/sanity/queries";

export type Aviso = {
  id: string;
  titulo: string;
  subtitulo: string;
  imagenHero?: string;
  imagenHeroSet?: { s480: string; s800: string; s1200: string };
  imagenHeroAlt?: string;
  ctaTexto: string;
  ctaHref: string;
  microcopy?: string;
};

type RawAviso = {
  _id: string;
  titulo: string;
  subtitulo: string;
  imagenHero?: (SanityImage & { alt?: string }) | null;
  ctaTexto?: string;
  ctaHref: string;
  microcopy?: string;
};

const AVISO_FIELDS = /* groq */ `
  _id, titulo, subtitulo, imagenHero{ asset, "alt": alt }, ctaTexto, ctaHref, microcopy
`;

function mapAviso(a: RawAviso): Aviso {
  const s480 = urlForImage(a.imagenHero, 480);
  const s800 = urlForImage(a.imagenHero, 800);
  const s1200 = urlForImage(a.imagenHero, 1200);
  return {
    id: a._id,
    titulo: a.titulo,
    subtitulo: a.subtitulo,
    imagenHero: s1200,
    imagenHeroSet: s480 && s800 && s1200 ? { s480, s800, s1200 } : undefined,
    imagenHeroAlt: a.imagenHero?.alt || a.titulo,
    ctaTexto: a.ctaTexto || "Ver más",
    ctaHref: a.ctaHref,
    microcopy: a.microcopy,
  };
}

/** El aviso activo más reciente (para el hero de la home). */
export async function getAvisoActivo(): Promise<Aviso | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawAviso | null>(
      /* groq */ `*[_type == "aviso" && activo == true] | order(_updatedAt desc)[0]{ ${AVISO_FIELDS} }`,
      {},
      { next: { revalidate: 60 } }
    );
    return raw ? mapAviso(raw) : null;
  } catch (err) {
    console.error("[sanity] aviso activo falló:", err);
    return null;
  }
}
