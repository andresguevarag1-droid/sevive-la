/**
 * Capa de datos de las páginas de vertical: una sola query GROQ por vertical
 * con fallback al mock filtrado. La página nunca revienta: si no hay contenido
 * en una sección, la sección muestra su estado vacío.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { Story } from "@/lib/content";
import {
  lead as mockLead,
  week as mockWeek,
  features as mockFeatures,
  videos as mockVideos,
  beneficios as mockBeneficios,
} from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";
import {
  cronicaToStory,
  eventoToStory,
  reelToStory,
  beneficioToStory,
  type RawCronica,
  type RawEvento,
  type RawReel,
  type RawBeneficio,
  type SanityImage,
} from "@/lib/sanity/queries";

/* ── Consulta única por vertical ── */
const VERTICAL_QUERY = /* groq */ `{
  "cronicas": *[_type == "cronica" && vertical == $vertical] | order(fecha desc)[0...12]{
    _id, title, vertical, bajada, autor, formato, lecturaMin, imagen, "slug": slug.current
  },
  "eventos": *[_type == "evento" && vertical == $vertical && defined(inicio) && inicio >= $desde] | order(inicio asc)[0...8]{
    _id, title, vertical, inicio, lugar, imagen, "slug": slug.current, horaPorConfirmar
  },
  "reels": *[_type == "reel" && vertical == $vertical] | order(orden asc, fecha desc)[0...8]{
    _id, title, vertical, duracion, miniatura, videoUrl
  },
  "beneficios": *[_type == "beneficio" && vertical == $vertical && (!defined(vigencia) || vigencia >= $hoy)] | order(orden asc, _createdAt desc)[0...6]{
    _id, title, vertical, marca, detalle, patrocinado, vigencia, cupoMaximo, imagen, "slug": slug.current
  },
  "lugares": *[_type == "lugar" && vertical == $vertical] | order(_createdAt desc)[0...6]{
    _id, title, vertical, ubicacion, imagen
  }
}`;

type RawLugar = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  ubicacion?: string;
  imagen?: SanityImage;
};

type RawVertical = {
  cronicas: RawCronica[];
  eventos: RawEvento[];
  reels: RawReel[];
  beneficios: RawBeneficio[];
  lugares: RawLugar[];
};

function lugarToStory(l: RawLugar): Story {
  return {
    id: l._id,
    type: "lugar",
    vertical: l.vertical,
    title: l.title,
    meta: l.ubicacion || "",
    img: urlForImage(l.imagen, 800),
  };
}

export type VerticalContent = {
  cronicas: Story[];
  eventos: Story[];
  reels: Story[];
  beneficios: Story[];
  lugares: Story[];
};

/** Fallback: el mock del home filtrado por vertical (puede quedar vacío). */
function fallbackFor(vertical: VerticalSlug): VerticalContent {
  const porVertical = (s: Story) => s.vertical === vertical;
  return {
    cronicas: [mockLead, ...mockFeatures].filter(porVertical),
    eventos: mockWeek.filter(porVertical),
    reels: mockVideos.filter(porVertical),
    beneficios: mockBeneficios.filter(porVertical),
    lugares: [],
  };
}

/**
 * Contenido de una vertical. Nunca lanza: ante fallo de Sanity usa el mock
 * filtrado; ante secciones vacías devuelve arrays vacíos (estado vacío en UI).
 */
export async function getVerticalContent(
  vertical: VerticalSlug
): Promise<VerticalContent> {
  if (!sanityConfigured) return fallbackFor(vertical);
  try {
    const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const hoy = new Date().toISOString().slice(0, 10);
    const data = await client.fetch<RawVertical>(
      VERTICAL_QUERY,
      { vertical, desde, hoy },
      { next: { revalidate: 60 } }
    );

    const content: VerticalContent = {
      cronicas: (data?.cronicas ?? []).map(cronicaToStory),
      eventos: (data?.eventos ?? []).map(eventoToStory),
      reels: (data?.reels ?? []).map(reelToStory),
      beneficios: (data?.beneficios ?? []).map(beneficioToStory),
      lugares: (data?.lugares ?? []).map(lugarToStory),
    };

    // Vacío real = estado vacío editorial en la página (sin mocks).
    return content;
  } catch (err) {
    console.error(`[sanity] vertical "${vertical}" falló, usando mock:`, err);
    return fallbackFor(vertical);
  }
}
