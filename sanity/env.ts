/**
 * Variables de entorno de Sanity. El projectId y el dataset son públicos
 * (viajan en cada request del navegador), por eso llevan un valor por defecto:
 * el sitio funciona apenas se despliega, aunque aún no se hayan configurado
 * las variables en Vercel. El token de lectura, en cambio, es SOLO SERVIDOR.
 */

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "srgf579x";

/** Token de lectura para datasets privados. Nunca con prefijo NEXT_PUBLIC_. */
export const readToken = process.env.SANITY_API_READ_TOKEN || "";

/** true cuando hay un projectId válido con el que consultar. */
export const sanityConfigured = Boolean(projectId);
