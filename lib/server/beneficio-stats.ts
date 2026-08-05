/**
 * Cupones emitidos por beneficio (prueba social + cupos) — SOLO SERVIDOR.
 * Lee la vista coupon_stats; si Supabase no está o la vista falta, devuelve
 * un mapa vacío y las tarjetas se dibujan sin números (nada revienta).
 */
import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export async function getEmitidosPorBeneficio(): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  const db = getServiceClient();
  if (!db) return mapa;
  try {
    const { data, error } = await db
      .from("coupon_stats")
      .select("benefit_slug, emitidos");
    if (error) return mapa;
    for (const f of (data ?? []) as { benefit_slug: string; emitidos: number }[]) {
      mapa.set(f.benefit_slug, f.emitidos ?? 0);
    }
  } catch {
    /* sin datos: tarjetas sin números */
  }
  return mapa;
}
