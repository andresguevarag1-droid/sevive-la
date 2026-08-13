/**
 * Capa de datos de la transmisión en vivo (/en-vivo + banda del home).
 * Patrón de la casa: si Sanity falla o no está configurado, se devuelve
 * null y la página queda en reposo — nada revienta el render.
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";

export type Transmision = {
  id: string;
  titulo: string;
  descripcion?: string;
  /** ID del video de YouTube ya extraído del enlace pegado en el Studio. */
  youtubeId?: string;
  programadaPara?: string;
  activa: boolean;
};

type RawTransmision = {
  _id: string;
  titulo?: string;
  activa?: boolean;
  youtubeUrl?: string;
  descripcion?: string;
  programadaPara?: string;
};

/**
 * Extrae el ID de video de cualquier forma de enlace de YouTube:
 * watch?v=ID · youtu.be/ID · youtube.com/live/ID · youtube.com/embed/ID.
 */
export function extraerYoutubeId(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/
  );
  return m?.[1];
}

function mapTransmision(t: RawTransmision): Transmision {
  return {
    id: t._id,
    titulo: t.titulo ?? "Transmisión en vivo",
    descripcion: t.descripcion,
    youtubeId: extraerYoutubeId(t.youtubeUrl),
    programadaPara: t.programadaPara,
    activa: t.activa === true,
  };
}

const CAMPOS = `_id, titulo, activa, youtubeUrl, descripcion, programadaPara`;

export type EstadoEnVivo = {
  /** Transmitiendo AHORA (interruptor encendido en el Studio). */
  activa: Transmision | null;
  /** Próxima transmisión anunciada (para el estado en reposo). */
  proxima: Transmision | null;
};

/** Un viaje: la transmisión activa y/o la próxima anunciada. */
export async function getEstadoEnVivo(): Promise<EstadoEnVivo> {
  if (!sanityConfigured) return { activa: null, proxima: null };
  try {
    const raw = await client.fetch<{
      activa: RawTransmision | null;
      proxima: RawTransmision | null;
    }>(
      /* groq */ `{
        "activa": *[_type == "transmision" && activa == true] | order(_updatedAt desc)[0]{ ${CAMPOS} },
        "proxima": *[_type == "transmision" && activa != true && defined(programadaPara) && programadaPara > now()] | order(programadaPara asc)[0]{ ${CAMPOS} }
      }`,
      {},
      { next: { revalidate: 60 } }
    );
    return {
      activa: raw?.activa ? mapTransmision(raw.activa) : null,
      proxima: raw?.proxima ? mapTransmision(raw.proxima) : null,
    };
  } catch (err) {
    console.error("[sanity] estado en vivo falló:", err);
    return { activa: null, proxima: null };
  }
}
