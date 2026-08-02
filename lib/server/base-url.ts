/**
 * URL base REAL del despliegue actual, derivada del request.
 * Los links generados (referidos, cupones, correos) deben funcionar HOY en
 * sevive-la.vercel.app y mañana en sevive.la sin tocar código: nunca
 * hardcodear el dominio para URLs que viajan fuera del sitio.
 */
import "server-only";
import { site } from "@/lib/site";

/** Base desde un Request (route handlers): respeta el proxy de Vercel. */
export function getBaseUrl(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return site.url;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Base desde headers() (server components). */
export function baseUrlFromHeaders(h: Headers): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return site.url;
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
