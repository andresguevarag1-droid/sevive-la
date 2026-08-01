/**
 * Capa de datos del home: intenta leer de Sanity y, si está vacío o inaccesible,
 * cae al contenido mock. El sitio SIEMPRE renderiza. A medida que el equipo publica
 * en el Studio, cada sección se reemplaza sola por contenido real.
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

/* ── Consulta única (una sola ida a Sanity) ── */
const HOME_QUERY = /* groq */ `{
  "portada": *[_type == "cronica" && esPortada == true] | order(fecha desc)[0]{
    _id, title, vertical, bajada, autor, formato, lecturaMin, imagen
  },
  "features": *[_type == "cronica" && destacada == true] | order(fecha desc)[0...3]{
    _id, title, vertical, bajada, autor, formato, lecturaMin, imagen
  },
  "week": *[_type == "evento" && defined(inicio) && inicio >= $desde] | order(inicio asc)[0...6]{
    _id, title, vertical, inicio, lugar, imagen
  },
  "reels": *[_type == "reel"] | order(orden asc, fecha desc)[0...8]{
    _id, title, vertical, duracion, miniatura, videoUrl
  },
  "beneficios": *[_type == "beneficio"] | order(orden asc, _createdAt desc)[0...6]{
    _id, title, vertical, marca, detalle
  }
}`;

/* ── Tipos crudos de Sanity ── */
type SanityImage = { asset?: { _ref?: string } } | null | undefined;
type RawCronica = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  bajada?: string;
  autor?: string;
  formato?: string;
  lecturaMin?: number;
  imagen?: SanityImage;
};
type RawEvento = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  inicio: string;
  lugar?: string;
  imagen?: SanityImage;
};
type RawReel = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  duracion?: string;
  miniatura?: SanityImage;
  videoUrl?: string;
};
type RawBeneficio = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  marca?: string;
  detalle?: string;
};
type RawHome = {
  portada: RawCronica | null;
  features: RawCronica[];
  week: RawEvento[];
  reels: RawReel[];
  beneficios: RawBeneficio[];
};

/* ── Helpers ── */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Jue 6 · 11:00" a partir de un ISO, en hora de Costa Rica. */
function fmtEvento(inicio: string): string {
  const d = new Date(inicio);
  if (Number.isNaN(d.getTime())) return "";
  const dia = new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    timeZone: "America/Costa_Rica",
  })
    .format(d)
    .replace(/\./g, "");
  const hora = new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(d);
  return `${cap(dia)} · ${hora}`;
}

/* ── Mappers: Sanity → Story (forma que ya consumen los componentes) ── */
function cronicaToStory(c: RawCronica): Story {
  const meta = c.formato || "Crónica";
  return {
    id: c._id,
    type: "articulo",
    vertical: c.vertical,
    title: c.title,
    dek: c.bajada,
    author: c.autor,
    meta: c.lecturaMin ? `${meta} · ${c.lecturaMin} min` : meta,
    img: urlForImage(c.imagen, 1400),
  };
}
function eventoToStory(e: RawEvento): Story {
  return {
    id: e._id,
    type: "evento",
    vertical: e.vertical,
    title: e.lugar ? `${e.title}, ${e.lugar}` : e.title,
    meta: fmtEvento(e.inicio),
    img: urlForImage(e.imagen, 800),
  };
}
function reelToStory(r: RawReel): Story {
  return {
    id: r._id,
    type: "video",
    vertical: r.vertical,
    title: r.title,
    meta: r.duracion || "",
    img: urlForImage(r.miniatura, 600),
  };
}
function beneficioToStory(b: RawBeneficio): Story {
  return {
    id: b._id,
    type: "promo",
    vertical: b.vertical,
    title: b.title,
    author: b.marca,
    meta: b.detalle || "",
  };
}

export type HomeContent = {
  lead: Story;
  week: Story[];
  features: Story[];
  videos: Story[];
  beneficios: Story[];
};

const FALLBACK: HomeContent = {
  lead: mockLead,
  week: mockWeek,
  features: mockFeatures,
  videos: mockVideos,
  beneficios: mockBeneficios,
};

/**
 * Devuelve el contenido del home. Nunca lanza: ante cualquier fallo o vacío,
 * usa el mock por sección (fallback graceful).
 */
export async function getHomeContent(): Promise<HomeContent> {
  if (!sanityConfigured) return FALLBACK;
  try {
    const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const data = await client.fetch<RawHome>(
      HOME_QUERY,
      { desde },
      { next: { revalidate: 60 } }
    );

    const lead = data?.portada ? cronicaToStory(data.portada) : FALLBACK.lead;
    const features = (data?.features ?? []).map(cronicaToStory);
    const week = (data?.week ?? []).map(eventoToStory);
    const videos = (data?.reels ?? []).map(reelToStory);
    const beneficios = (data?.beneficios ?? []).map(beneficioToStory);

    return {
      lead,
      week: week.length ? week : FALLBACK.week,
      features: features.length ? features : FALLBACK.features,
      videos: videos.length ? videos : FALLBACK.videos,
      beneficios: beneficios.length ? beneficios : FALLBACK.beneficios,
    };
  } catch (err) {
    console.error("[sanity] home fetch falló, usando mock:", err);
    return FALLBACK;
  }
}
