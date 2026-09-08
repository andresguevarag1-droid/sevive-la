/**
 * Capa de datos de los capítulos del show (/capitulos).
 * Patrón de la casa: si Sanity falla, lista vacía — nada revienta.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { extraerYoutubeId } from "@/lib/sanity/transmision";

export type Capitulo = {
  id: string;
  titulo: string;
  youtubeId: string;
  numero?: number;
  fecha: string;
  descripcion?: string;
};

type RawCapitulo = {
  _id: string;
  titulo?: string;
  youtubeUrl?: string;
  numero?: number;
  fecha?: string;
  descripcion?: string;
};

export async function getCapitulos(): Promise<Capitulo[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<RawCapitulo[]>(
      /* groq */ `*[_type == "capitulo" && defined(youtubeUrl)] | order(fecha desc)[0...50]{
        _id, titulo, youtubeUrl, numero, fecha, descripcion
      }`,
      {},
      { next: { revalidate: 300 } }
    );
    return (raw ?? [])
      .map((c) => ({
        id: c._id,
        titulo: c.titulo ?? "Capítulo de SeViveLa",
        youtubeId: extraerYoutubeId(c.youtubeUrl) ?? "",
        numero: c.numero,
        fecha: c.fecha ?? "",
        descripcion: c.descripcion,
      }))
      .filter((c) => c.youtubeId);
  } catch (err) {
    console.error("[sanity] capítulos fallaron:", err);
    return [];
  }
}
