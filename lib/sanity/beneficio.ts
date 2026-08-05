/**
 * Capa de datos del detalle de beneficio (/promociones/[slug]).
 * null si no existe o Sanity falla (→ 404).
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import type { VerticalSlug } from "@/lib/site";

export type BeneficioDetalle = {
  id: string;
  title: string;
  slug: string;
  marca: string;
  vertical: VerticalSlug;
  detalle: string;
  vigencia?: string; // YYYY-MM-DD (último día válido)
  patrocinado?: boolean;
  cuponMedible?: boolean;
  cupoMaximo?: number;
  instruccionesCanje?: string;
};

export async function getBeneficio(slug: string): Promise<BeneficioDetalle | null> {
  if (!sanityConfigured) return null;
  try {
    const raw = await client.fetch<BeneficioDetalle | null>(
      /* groq */ `*[_type == "beneficio" && slug.current == $slug][0]{
        "id": _id, title, "slug": slug.current, marca, vertical, detalle,
        vigencia, patrocinado, cuponMedible, cupoMaximo, instruccionesCanje
      }`,
      { slug },
      { next: { revalidate: 60 } }
    );
    return raw ?? null;
  } catch (err) {
    console.error(`[sanity] beneficio "${slug}" falló:`, err);
    return null;
  }
}

/** ¿El beneficio sigue vigente? (vigencia = último día válido, hora CR). */
export function beneficioVigente(b: BeneficioDetalle, ahora = new Date()): boolean {
  if (!b.vigencia) return true;
  // Fin del día de vigencia en CR (UTC-6) = 05:59:59Z del día siguiente.
  const fin = new Date(`${b.vigencia}T23:59:59-06:00`);
  return !Number.isNaN(fin.getTime()) && ahora <= fin;
}
