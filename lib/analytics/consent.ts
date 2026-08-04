/**
 * Consentimiento de cookies/analítica (D4, Ley 8968) — SOLO CLIENTE.
 * - Lo esencial y la medición sin cookies (Vercel Analytics) corren siempre.
 * - La analítica de producto (PostHog) SOLO corre tras un "sí" explícito.
 * Se guarda versión + fecha + decisión; cambiar VERSION re-pregunta a todos.
 */
export const CONSENT_VERSION = "v2";
const CLAVE = `sv_consent_${CONSENT_VERSION}`;
/** Evento que dispara el banner al decidir (lo escucha la capa de analítica). */
export const CONSENT_EVENT = "sv-consent";

export type Consentimiento = {
  analitica: boolean;
  fecha: string;
  version: string;
};

export function getConsentimiento(): Consentimiento | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Consentimiento) : null;
  } catch {
    return null;
  }
}

export function setConsentimiento(analitica: boolean): void {
  const valor: Consentimiento = {
    analitica,
    fecha: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(valor));
  } catch {
    /* sin memoria local */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: valor }));
}
