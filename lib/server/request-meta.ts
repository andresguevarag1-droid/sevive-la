/**
 * Metadatos del request para la auditoría de consentimiento (Ley 8968) y el
 * rate-limit: IP y User-Agent.
 *
 * IMPORTANTE: nunca tomar el PRIMER valor de x-forwarded-for — ese header
 * es una lista que cualquier cliente puede mandar con valores propios al
 * principio; Vercel solo AGREGA la IP real, no la garantiza primera. Usamos
 * x-vercel-forwarded-for (lo pone Vercel, el cliente no puede sobreescribirlo)
 * o x-real-ip primero; si ninguno existe (dev local), se toma el ÚLTIMO
 * valor de x-forwarded-for en vez del primero.
 */
import "server-only";

export function getClientIp(req: Request): string | null {
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0]?.trim() || null;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const partes = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    if (partes.length > 0) return partes[partes.length - 1];
  }
  return null;
}

export function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}
