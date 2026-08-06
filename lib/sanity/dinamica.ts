/**
 * Capa de datos de dinámicas/giveaways (lado editorial, Sanity).
 * La captura de participantes vive en Supabase (/api/dinamica).
 */
import "server-only";
import type { PortableTextBlock } from "@portabletext/types";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { VerticalSlug } from "@/lib/site";
import type { SanityImage } from "@/lib/sanity/queries";

export type Dinamica = {
  id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  premio: string;
  descripcion?: PortableTextBlock[];
  imagen?: string;
  imagenAlt?: string;
  inicio: string;
  cierre: string;
  pregunta?: string;
  marca?: string;
  patrocinado?: boolean;
  bases?: PortableTextBlock[];
};

type RawDinamica = {
  _id: string;
  title: string;
  slug: string;
  vertical: VerticalSlug;
  premio: string;
  descripcion?: PortableTextBlock[];
  imagen?: (SanityImage & { alt?: string }) | null;
  inicio: string;
  cierre: string;
  pregunta?: string;
  marca?: string;
  patrocinado?: boolean;
  bases?: PortableTextBlock[];
};

const DINAMICA_FIELDS = /* groq */ `
  _id, title, "slug": slug.current, vertical, premio, descripcion,
  imagen{ asset, "alt": alt }, inicio, cierre, pregunta, marca, patrocinado, bases
`;

function mapDinamica(d: RawDinamica): Dinamica {
  return {
    id: d._id,
    title: d.title,
    slug: d.slug,
    vertical: d.vertical,
    premio: d.premio,
    descripcion: d.descripcion,
    imagen: urlForImage(d.imagen, 1400),
    imagenAlt: d.imagen?.alt || d.title,
    inicio: d.inicio,
    cierre: d.cierre,
    pregunta: d.pregunta,
    marca: d.marca,
    patrocinado: d.patrocinado,
    bases: d.bases,
  };
}

/** Una dinámica por slug. null si no existe o Sanity falla (→ 404 en la página). */
export async function getDinamica(slug: string): Promise<Dinamica | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<RawDinamica | null>(
      /* groq */ `*[_type == "dinamica" && slug.current == $slug][0]{ ${DINAMICA_FIELDS} }`,
      { slug },
      { next: { revalidate: 60 } }
    );
    return raw ? mapDinamica(raw) : null;
  } catch (err) {
    console.error(`[sanity] dinámica "${slug}" falló:`, err);
    return null;
  }
}

/** Dinámicas cuya ventana de participación no ha cerrado, próximas a cerrar primero. */
export async function getDinamicasAbiertas(): Promise<Dinamica[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<RawDinamica[]>(
      /* groq */ `*[_type == "dinamica" && cierre >= now()] | order(cierre asc)[0...12]{ ${DINAMICA_FIELDS} }`,
      {},
      { next: { revalidate: 60 } }
    );
    return (raw ?? []).map(mapDinamica);
  } catch (err) {
    console.error("[sanity] listado de dinámicas falló:", err);
    return [];
  }
}

export type EstadoDinamica = "proximamente" | "abierta" | "cerrada";

export function estadoDinamica(d: Dinamica, ahora = new Date()): EstadoDinamica {
  const inicio = new Date(d.inicio);
  const cierre = new Date(d.cierre);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(cierre.getTime()))
    return "cerrada";
  if (ahora < inicio) return "proximamente";
  if (ahora > cierre) return "cerrada";
  return "abierta";
}
