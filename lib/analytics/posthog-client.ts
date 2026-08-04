/**
 * Init de PostHog — SOLO CLIENTE, cargado por import dinámico tras el
 * consentimiento (D4). No debe vivir en la raíz como instrumentation-client:
 * ahí Next lo mete al bundle inicial de todas las páginas (~50KB de más).
 * Acepta las variables del asistente de PostHog y la nuestra.
 */
import posthog from "posthog-js";

const token =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

let initialized = false;

export function initializePostHog(): boolean {
  if (initialized) return true;
  if (!token) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[posthog] falta NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN — apagado.");
    }
    return false;
  }
  posthog.init(token, {
    api_host: "/ingest",
    ui_host: host,
    capture_pageview: false, // App Router: lo emitimos a mano por ruta
    capture_exceptions: true,
    person_profiles: "identified_only",
    autocapture: false, // taxonomía explícita, no ruido
    debug: process.env.NODE_ENV === "development",
  });
  initialized = true;
  return true;
}

export default posthog;
