/**
 * Autorización de crons (Vercel Cron manda CRON_SECRET como Bearer).
 * Comparación en tiempo constante vía hash: sin fugas por timing.
 */
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export function cronAutorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recibido = req.headers.get("authorization") ?? "";
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}
