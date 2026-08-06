/**
 * Origen del envío — SOLO CLIENTE, se lee EN EL INSTANTE de enviar un
 * formulario. Es dato de primera parte (la URL que la persona tiene
 * abierta), así que no depende de cookies ni del consentimiento de
 * analítica: sin esto, la mayoría de registros decían "directo" porque
 * la atribución guardada (sv_attr) solo existe si se aceptó el aviso.
 *
 * Prioridad: UTM presente en la URL > first-touch guardado (si existe).
 * Siempre incluye la página desde la que se envió (landing).
 */
import { getAttribution, type Atribucion } from "@/lib/analytics/attribution";

const UTM: [keyof Atribucion, string][] = [
  ["source", "utm_source"],
  ["medium", "utm_medium"],
  ["campaign", "utm_campaign"],
  ["content", "utm_content"],
  ["term", "utm_term"],
];

/** Topes alineados con los esquemas Zod del servidor (source/medium 80…). */
const MAX: Record<keyof Atribucion, number> = {
  source: 80,
  medium: 80,
  campaign: 120,
  content: 120,
  term: 120,
  referrer: 200,
  landing: 120,
};

export function utmEnvio(): Atribucion {
  try {
    const p = new URLSearchParams(location.search);
    const actual: Atribucion = {};
    for (const [k, param] of UTM) {
      const v = p.get(param);
      if (v) actual[k] = v;
    }
    // gclid/fbclid delatan el canal aunque falte el utm_source.
    if (!actual.source && p.get("fbclid")) actual.source = "facebook-ads";
    if (!actual.source && p.get("gclid")) actual.source = "google-ads";

    const merged: Atribucion = { ...getAttribution(), ...actual };
    if (!merged.referrer && document.referrer && !document.referrer.includes(location.hostname)) {
      merged.referrer = document.referrer;
    }
    merged.landing = location.pathname;

    for (const k of Object.keys(merged) as (keyof Atribucion)[]) {
      const v = merged[k];
      if (typeof v === "string") merged[k] = v.slice(0, MAX[k]);
    }
    return merged;
  } catch {
    return {};
  }
}
