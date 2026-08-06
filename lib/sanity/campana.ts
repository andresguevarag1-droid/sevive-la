/**
 * Capa de datos de campañas (hero de home + landing de captura).
 * Lado editorial en Sanity; la captura vive en Supabase (campaign_entries).
 */
import "server-only";
import type { PortableTextBlock } from "@portabletext/types";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { VerticalSlug } from "@/lib/site";
import type { SanityImage } from "@/lib/sanity/queries";

export type Campana = {
  id: string;
  titulo: string;
  subtitulo: string;
  slug: string;
  activa: boolean;
  vertical: VerticalSlug;
  imagenHero?: string;
  /** Variantes responsivas del arte (CDN de Sanity, AVIF/WebP automático). */
  imagenHeroSet?: { s480: string; s800: string; s1200: string };
  imagenHeroAlt?: string;
  ogImage?: string;
  ctaTexto: string;
  microcopy?: string;
  inicia: string;
  termina: string;
  premio: string;
  patrocinador?: string;
  patrocinado?: boolean;
  referidosActivos?: boolean;
  chancesMaxPorReferido?: number;
  bases?: PortableTextBlock[];
};

type RawCampana = {
  _id: string;
  titulo: string;
  subtitulo: string;
  slug: string;
  activa: boolean;
  vertical: VerticalSlug;
  imagenHero?: (SanityImage & { alt?: string }) | null;
  ogImage?: SanityImage | null;
  ctaTexto?: string;
  microcopy?: string;
  inicia: string;
  termina: string;
  premio: string;
  patrocinador?: string;
  patrocinado?: boolean;
  referidosActivos?: boolean;
  chancesMaxPorReferido?: number;
  bases?: PortableTextBlock[];
};

const CAMPANA_FIELDS = /* groq */ `
  _id, titulo, subtitulo, "slug": slug.current, activa, vertical,
  imagenHero{ asset, "alt": alt }, ogImage{ asset },
  ctaTexto, microcopy, inicia, termina, premio, patrocinador, patrocinado, referidosActivos, chancesMaxPorReferido, bases
`;

function mapCampana(c: RawCampana): Campana {
  const s480 = urlForImage(c.imagenHero, 480);
  const s800 = urlForImage(c.imagenHero, 800);
  const s1200 = urlForImage(c.imagenHero, 1200);
  return {
    id: c._id,
    titulo: c.titulo,
    subtitulo: c.subtitulo,
    slug: c.slug,
    activa: c.activa,
    vertical: c.vertical,
    imagenHero: s1200,
    imagenHeroSet:
      s480 && s800 && s1200 ? { s480, s800, s1200 } : undefined,
    imagenHeroAlt: c.imagenHero?.alt || c.titulo,
    ogImage: urlForImage(c.ogImage, 1200) ?? urlForImage(c.imagenHero, 1200),
    ctaTexto: c.ctaTexto || "Participá gratis",
    microcopy: c.microcopy,
    inicia: c.inicia,
    termina: c.termina,
    premio: c.premio,
    patrocinador: c.patrocinador,
    patrocinado: c.patrocinado,
    referidosActivos: c.referidosActivos !== false,
    chancesMaxPorReferido: c.chancesMaxPorReferido ?? 10,
    bases: c.bases,
  };
}

/** Campaña activa y dentro de su ventana (para el hero de la home). */
export async function getCampanaActiva(): Promise<Campana | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawCampana | null>(
      /* groq */ `*[_type == "campana" && activa == true && inicia <= now() && termina >= now()] | order(inicia desc)[0]{ ${CAMPANA_FIELDS} }`,
      {},
      { next: { revalidate: 60 } }
    );
    return raw ? mapCampana(raw) : null;
  } catch (err) {
    console.error("[sanity] campaña activa falló:", err);
    return null;
  }
}

/** Una campaña por slug (aunque esté pausada: la landing informa el estado). */
export async function getCampana(slug: string): Promise<Campana | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawCampana | null>(
      /* groq */ `*[_type == "campana" && slug.current == $slug][0]{ ${CAMPANA_FIELDS} }`,
      { slug },
      { next: { revalidate: 60 } }
    );
    return raw ? mapCampana(raw) : null;
  } catch (err) {
    console.error(`[sanity] campaña "${slug}" falló:`, err);
    return null;
  }
}

export type EstadoCampana = "proximamente" | "abierta" | "cerrada" | "pausada";

export function estadoCampana(c: Campana, ahora = new Date()): EstadoCampana {
  if (!c.activa) return "pausada";
  const inicia = new Date(c.inicia);
  const termina = new Date(c.termina);
  if (Number.isNaN(inicia.getTime()) || Number.isNaN(termina.getTime()))
    return "cerrada";
  if (ahora < inicia) return "proximamente";
  if (ahora > termina) return "cerrada";
  return "abierta";
}
