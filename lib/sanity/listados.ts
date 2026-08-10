/**
 * Capa de datos de las páginas de listado (/agenda, /videos, /promociones,
 * /buscar). Igual que el home: Sanity con fallback a mock; nada revienta.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { urlForImage } from "@/sanity/lib/image";
import type { Story } from "@/lib/content";
import {
  week as mockWeek,
  videos as mockVideos,
  beneficios as mockBeneficios,
} from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";
import {
  eventoToStory,
  reelToStory,
  type RawEvento,
  type RawReel, hoyCR } from "@/lib/sanity/queries";

/* ── Agenda ── */

export type EventoAgenda = Story & {
  inicio: string;
  fin?: string;
  lugarNombre?: string;
  /** "19:00" en hora CR; undefined si la hora está por confirmar. */
  hora?: string;
};

/**
 * Eventos próximos (desde hace 12h hasta +60 días) MÁS los "en curso":
 * eventos ya iniciados cuyo fin todavía no llega (exposiciones, temporadas).
 * Ordenados por inicio; el ISO viaja para agrupar por día en la página.
 */
export async function getEventosProximos(): Promise<EventoAgenda[]> {
  if (!sanityConfigured) {
    return mockWeek.map((s) => ({ ...s, inicio: "" }));
  }
  try {
    const ahora = new Date().toISOString();
    const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const hasta = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const raw = await client.fetch<(RawEvento & { fin?: string })[]>(
      /* groq */ `*[_type == "evento" && defined(inicio) && (
        (inicio >= $desde && inicio <= $hasta) ||
        (inicio < $ahora && defined(fin) && fin >= $ahora)
      )] | order(inicio asc)[0...48]{
        _id, title, vertical, inicio, fin, lugar, imagen, "slug": slug.current, horaPorConfirmar
      }`,
      { ahora, desde, hasta },
      { next: { revalidate: 60 } }
    );
    const items = (raw ?? []).map((e) => ({
      ...eventoToStory(e),
      // En la agenda el lugar va en su propia línea: título sin concatenar.
      title: e.title,
      inicio: e.inicio,
      fin: e.fin,
      lugarNombre: e.lugar,
      hora: e.horaPorConfirmar
        ? undefined
        : new Intl.DateTimeFormat("es-CR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Costa_Rica",
          }).format(new Date(e.inicio)),
    }));
    return items;
  } catch (err) {
    console.error("[sanity] agenda falló, usando mock:", err);
    return mockWeek.map((s) => ({ ...s, inicio: "" }));
  }
}

/* ── Videoteca ── */

export async function getReels(): Promise<Story[]> {
  if (!sanityConfigured) return mockVideos;
  try {
    const raw = await client.fetch<RawReel[]>(
      /* groq */ `*[_type == "reel"] | order(orden asc, fecha desc)[0...24]{
        _id, title, vertical, duracion, miniatura, videoUrl
      }`,
      {},
      { next: { revalidate: 60 } }
    );
    return (raw ?? []).map(reelToStory);
  } catch (err) {
    console.error("[sanity] videoteca falló, usando mock:", err);
    return mockVideos;
  }
}

/* ── Beneficios / Promociones ── */

export type Beneficio = Story & { patrocinado?: boolean; vigencia?: string };

type RawBeneficioFull = {
  _id: string;
  title: string;
  vertical: VerticalSlug;
  marca?: string;
  detalle?: string;
  patrocinado?: boolean;
  vigencia?: string;
  cupoMaximo?: number;
  imagen?: unknown;
  slug?: string;
};

/**
 * UN beneficio sugerido para el cierre de crónica: prefiere la vertical de
 * la nota y cae a cualquiera vigente. Antes se traía la cuponera ENTERA
 * para mostrar un solo cupón.
 */
export async function getBeneficioSugerido(
  vertical: VerticalSlug
): Promise<Beneficio | null> {
  if (!sanityConfigured) return mockBeneficios[0] ?? null;
  try {
    const hoy = hoyCR();
    const raw = await client.fetch<RawBeneficioFull | null>(
      /* groq */ `*[_type == "beneficio" && defined(slug.current) && (!defined(vigencia) || vigencia >= $hoy)]
        | order(select(vertical == $vertical => 0, 1) asc, orden asc, _createdAt desc)[0]{
        _id, title, vertical, marca, detalle, patrocinado, vigencia, cupoMaximo, imagen, "slug": slug.current
      }`,
      { hoy, vertical },
      { next: { revalidate: 60 } }
    );
    if (!raw) return null;
    return {
      id: raw._id,
      type: "promo" as const,
      vertical: raw.vertical,
      title: raw.title,
      author: raw.marca,
      meta: raw.detalle || "",
      patrocinado: raw.patrocinado,
      vigencia: raw.vigencia,
      cupoMaximo: raw.cupoMaximo,
      img: urlForImage(raw.imagen as Parameters<typeof urlForImage>[0], 600),
      href: raw.slug ? `/promociones/${raw.slug}` : undefined,
    };
  } catch (err) {
    console.error("[sanity] beneficio sugerido falló:", err);
    return null;
  }
}

export async function getBeneficiosTodos(): Promise<Beneficio[]> {
  if (!sanityConfigured) return mockBeneficios;
  try {
    const hoy = hoyCR();
    const raw = await client.fetch<RawBeneficioFull[]>(
      /* groq */ `*[_type == "beneficio" && (!defined(vigencia) || vigencia >= $hoy)] | order(orden asc, _createdAt desc)[0...24]{
        _id, title, vertical, marca, detalle, patrocinado, vigencia, cupoMaximo, imagen, "slug": slug.current
      }`,
      { hoy },
      { next: { revalidate: 60 } }
    );
    const items = (raw ?? []).map((b) => ({
      id: b._id,
      type: "promo" as const,
      vertical: b.vertical,
      title: b.title,
      author: b.marca,
      meta: b.detalle || "",
      patrocinado: b.patrocinado,
      vigencia: b.vigencia,
      cupoMaximo: b.cupoMaximo,
      img: urlForImage(b.imagen as Parameters<typeof urlForImage>[0], 600),
      href: b.slug ? `/promociones/${b.slug}` : undefined,
    }));
    return items;
  } catch (err) {
    console.error("[sanity] beneficios falló, usando mock:", err);
    return mockBeneficios;
  }
}

/* ── Búsqueda ── */

type RawResultado = {
  _id: string;
  _type: string;
  title: string;
  vertical: VerticalSlug;
  bajada?: string;
  lugar?: string;
  detalle?: string;
  imagen?: { asset?: { _ref?: string } };
  miniatura?: { asset?: { _ref?: string } };
  slug?: string;
  videoUrl?: string;
};

/** Destino real de cada resultado (sin esto, todo caía en la vertical). */
function hrefResultado(r: RawResultado): string | undefined {
  if (r._type === "cronica" && r.slug) return `/cronica/${r.slug}`;
  if (r._type === "evento" && r.slug) return `/agenda/${r.slug}`;
  if (r._type === "beneficio" && r.slug) return `/promociones/${r.slug}`;
  if (r._type === "reel" && r.videoUrl) return r.videoUrl;
  if (r._type === "lugar" && r.slug) return `/lugares/${r.slug}`;
  return undefined;
}

const TYPE_TO_CONTENT: Record<string, Story["type"]> = {
  cronica: "articulo",
  evento: "evento",
  lugar: "lugar",
  beneficio: "promo",
  reel: "video",
  galeria: "galeria",
};

/** Búsqueda simple por texto en títulos y descripciones (máx. 24 resultados). */
export async function buscarContenido(q: string): Promise<Story[]> {
  const query = q.trim();
  if (!sanityConfigured || query.length < 2) return [];
  try {
    const term = `${query}*`;
    const raw = await client.fetch<RawResultado[]>(
      /* groq */ `*[_type in ["cronica","evento","lugar","beneficio","reel","galeria"] &&
        (title match $term || bajada match $term || lugar match $term || detalle match $term)
      ] | score(title match $term) | order(_score desc)[0...24]{
        _id, _type, title, vertical, bajada, lugar, detalle, imagen, miniatura,
        "slug": slug.current, videoUrl
      }`,
      { term },
      { next: { revalidate: 60 } }
    );
    return (raw ?? []).map((r) => ({
      id: r._id,
      type: TYPE_TO_CONTENT[r._type] ?? "articulo",
      vertical: r.vertical,
      title: r.title,
      dek: r.bajada || r.detalle || r.lugar,
      meta: "",
      img: urlForImage(r.imagen ?? r.miniatura, 800),
      href: hrefResultado(r),
    }));
  } catch (err) {
    console.error("[sanity] búsqueda falló:", err);
    return [];
  }
}
