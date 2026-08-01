/**
 * Metadatos del request para la auditoría de consentimiento (Ley 8968):
 * IP y User-Agent. En Vercel la IP real viene en x-forwarded-for.
 */
import "server-only";

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip");
}

export function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}
