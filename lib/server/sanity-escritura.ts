/**
 * Cliente de ESCRITURA de Sanity — SOLO SERVIDOR, solo para los robots
 * (crons de reels y de artículos). Necesita SANITY_API_WRITE_TOKEN en
 * Vercel (token con rol Editor, creado en sanity.io/manage). Sin token,
 * las automatizaciones duermen y avisan, igual que Resend.
 */
import "server-only";
import { createClient, type SanityClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";

const token = process.env.SANITY_API_WRITE_TOKEN || "";

/** true cuando el robot puede crear contenido en Sanity. */
export const escrituraSanityHabilitada = Boolean(projectId && token);

let cliente: SanityClient | null = null;

export function getWriteClient(): SanityClient | null {
  if (!escrituraSanityHabilitada) return null;
  if (!cliente) {
    cliente = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false,
      // "raw" ve borradores y publicados: el robot debe saber si el
      // artículo ya existe en cualquiera de los dos estados.
      perspective: "raw",
    });
  }
  return cliente;
}
