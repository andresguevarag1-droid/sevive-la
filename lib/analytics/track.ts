/**
 * Taxonomía de eventos del embudo (D3) — SOLO CLIENTE.
 * - PostHog recibe todo (si la persona consintió y hay clave configurada).
 * - Vercel Analytics (sin cookies) recibe solo las conversiones clave.
 * Nombres estables en snake_case; si no hay analítica cargada, no pasa nada.
 */
import { track as vercelTrack } from "@vercel/analytics";

type Props = Record<string, string | number | boolean>;

/** Conversiones que también van a Vercel Analytics (sin cookies). */
const CONVERSIONES = new Set([
  "form_submit_success",
  "referral_share_click",
  "coupon_claim",
  "newsletter_subscribe",
]);

type PosthogLike = { capture: (evento: string, props?: Props) => void };

export function track(evento: string, props: Props = {}): void {
  if (typeof window === "undefined") return;
  try {
    const ph = (window as { posthog?: PosthogLike }).posthog;
    ph?.capture(evento, props);
  } catch {
    /* nunca romper la UI por telemetría */
  }
  try {
    if (CONVERSIONES.has(evento)) vercelTrack(evento, props);
  } catch {
    /* ídem */
  }
}
