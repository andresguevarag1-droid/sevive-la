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
  type RawReel,
} from "@/lib/sanity/queries";

/* ── Agenda ── */

export type EventoAgenda = Story & { inicio: string; lugarNombre?: string };

/**
 * Eventos próximos (desde hace 12h hasta +60 días), ordenados por inicio.
 * Devuelve el ISO de inicio para poder agrupar por día en la página.
 */
export async function getEventosProximos(): Promise<EventoAgenda[]> {
  if (!sanityConfigured) {
    return mockWeek.map((s) => ({ ...s, inicio: "" }));
  }
  try {
    const desde = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const hasta = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const raw = await client.fetch<RawEvento[]>(
      /* groq */ `*[_type == "evento" && defined(inicio) && inicio >= $desde && inicio <= $hasta] | order(inicio asc)[0...48]{
        _id, title, vertical, inicio, lugar, imagen
      }`,
      { desde, hasta },
      { next: { revalidate: 60 } }
    );
    const items = (raw ?? []).map((e) => ({
      ...eventoToStory(e),
      inicio: e.inicio,
      lugarNombre: e.lugar,
    }));
    return items.length ? items : mockWeek.map((s) => ({ ...s, inicio: "" }));
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
    const items = (raw ?? []).map(reelToStory);
    return items.length ? items : mockVideos;
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
};

export async function getBeneficiosTodos(): Promise<Beneficio[]> {
  if (!sanityConfigured) return mockBeneficios;
  try {
    const hoy = new Date().toISOString().slice(0, 10);
    const raw = await client.fetch<RawBeneficioFull[]>(
      /* groq */ `*[_type == "beneficio" && (!defined(vigencia) || vigencia >= $hoy)] | order(orden asc, _createdAt desc)[0...24]{
        _id, title, vertical, marca, detalle, patrocinado, vigencia
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
    }));
    return items.length ? items : mockBeneficios;
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
};

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
        _id, _type, title, vertical, bajada, lugar, detalle, imagen, miniatura
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
    }));
  } catch (err) {
    console.error("[sanity] búsqueda falló:", err);
    return [];
  }
}
