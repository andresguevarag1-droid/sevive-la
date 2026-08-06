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
  "portadas": *[_type == "cronica" && esPortada == true && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...5]{
    _id, title, vertical, bajada, autor, formato, lecturaMin, imagen, "slug": slug.current
  },
  "features": *[_type == "cronica" && destacada == true && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...3]{
    _id, title, vertical, bajada, autor, formato, lecturaMin, imagen, "slug": slug.current
  },
  "week": *[_type == "evento" && defined(inicio) && inicio >= $desde] | order(inicio asc)[0...6]{
    _id, title, vertical, inicio, lugar, imagen, "slug": slug.current, horaPorConfirmar
  },
  "reels": *[_type == "reel"] | order(orden asc, fecha desc)[0...8]{
    _id, title, vertical, duracion, miniatura, videoUrl
  },
  "beneficios": *[_type == "beneficio" && (!defined(vigencia) || vigencia >= $hoy)] | order(orden asc, _createdAt desc)[0...6]{
    _id, title, vertical, marca, detalle, patrocinado, vigencia, cupoMaximo, imagen, "slug": slug.current
  }
}`;

/* ── Tipos crudos de Sanity (compartidos con las queries por vertical) ── */
export type SanityImage = { asset?: { _ref?: string } } | null | undefined;
export type RawCronica = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  bajada?: string;
  autor?: string;
  formato?: string;
  lecturaMin?: number;
  imagen?: SanityImage;
  slug?: string;
};
export type RawEvento = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  inicio: string;
  lugar?: string;
  imagen?: SanityImage;
  slug?: string;
  horaPorConfirmar?: boolean;
};
export type RawReel = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  duracion?: string;
  miniatura?: SanityImage;
  videoUrl?: string;
};
export type RawBeneficio = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  marca?: string;
  detalle?: string;
  patrocinado?: boolean;
  vigencia?: string;
  cupoMaximo?: number;
  imagen?: SanityImage;
  slug?: string;
};
type RawHome = {
  portadas: RawCronica[];
  features: RawCronica[];
  week: RawEvento[];
  reels: RawReel[];
  beneficios: RawBeneficio[];
};

/* ── Helpers ── */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Jue 6 · 11:00" (o "Jue 6" si la hora está por confirmar), en hora CR. */
export function fmtEvento(inicio: string, conHora = true): string {
  const d = new Date(inicio);
  if (Number.isNaN(d.getTime())) return "";
  const dia = new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    timeZone: "America/Costa_Rica",
  })
    .format(d)
    .replace(/\./g, "");
  if (!conHora) return cap(dia);
  const hora = new Intl.DateTimeFormat("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(d);
  return `${cap(dia)} · ${hora}`;
}

/* ── Mappers: Sanity → Story (forma que ya consumen los componentes) ── */
export function cronicaToStory(c: RawCronica): Story {
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
    href: c.slug ? `/cronica/${c.slug}` : undefined,
  };
}
export function eventoToStory(e: RawEvento): Story {
  return {
    id: e._id,
    type: "evento",
    vertical: e.vertical,
    title: e.lugar ? `${e.title}, ${e.lugar}` : e.title,
    meta: fmtEvento(e.inicio, !e.horaPorConfirmar),
    img: urlForImage(e.imagen, 800),
    href: e.slug ? `/agenda/${e.slug}` : undefined,
    fechaIso: e.inicio,
  };
}
export function reelToStory(r: RawReel): Story {
  return {
    id: r._id,
    type: "video",
    vertical: r.vertical,
    title: r.title,
    meta: r.duracion || "",
    img: urlForImage(r.miniatura, 600),
    // El reel real (IG/TikTok/YouTube): la tarjeta abre el video al tocar.
    href: r.videoUrl || undefined,
  };
}
export function beneficioToStory(b: RawBeneficio): Story {
  return {
    id: b._id,
    type: "promo",
    vertical: b.vertical,
    title: b.title,
    author: b.marca,
    meta: b.detalle || "",
    sponsored: b.patrocinado,
    vigencia: b.vigencia,
    cupoMaximo: b.cupoMaximo,
    img: urlForImage(b.imagen, 600),
    href: b.slug ? `/promociones/${b.slug}` : undefined,
  };
}

export type HomeContent = {
  /** Vacío cuando el equipo aún no marca notas de portada (la home lo oculta).
   *  Varias notas marcadas = carrusel de portadas que rota solo. */
  portadas: Story[];
  week: Story[];
  features: Story[];
  videos: Story[];
  beneficios: Story[];
};

const FALLBACK: HomeContent = {
  portadas: [mockLead],
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
    const hoy = new Date().toISOString().slice(0, 10);
    const data = await client.fetch<RawHome>(
      HOME_QUERY,
      { desde, hoy },
      { next: { revalidate: 60 } }
    );

    // Con Sanity respondiendo, lo que hay es lo que se muestra: una sección
    // vacía se OCULTA en la home (nada de mocks en producción).
    return {
      portadas: (data?.portadas ?? []).map(cronicaToStory),
      week: (data?.week ?? []).map(eventoToStory),
      features: (data?.features ?? []).map(cronicaToStory),
      videos: (data?.reels ?? []).map(reelToStory),
      beneficios: (data?.beneficios ?? []).map(beneficioToStory),
    };
  } catch (err) {
    console.error("[sanity] home fetch falló, usando mock:", err);
    return FALLBACK;
  }
}
