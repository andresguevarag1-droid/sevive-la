/**
 * Prueba social de eventos: cuántas personas guardaron un evento en su
 * agenda (saved_events) o pidieron aviso (event_interest). El dato ya se
 * capturaba y dormía en la base; ahora vende: "N personas lo tienen en su
 * agenda" convierte mejor que cualquier adjetivo.
 *
 * Se cuenta POR SLUG con count exacto en la base (head: true — viaja el
 * número, no las filas): payload constante y sin tope silencioso aunque
 * las tablas crezcan. cache() de React dedupe dentro del mismo render.
 * Sin Supabase → 0 (nada revienta).
 */
import "server-only";
import { cache } from "react";
import { getServiceClient } from "@/lib/supabase/server";

/** Mínimo para mostrar el dato: un "2 personas" vende en contra. */
export const MIN_PRUEBA_SOCIAL = 3;

export const getInteresadosEnEvento = cache(
  async (slug: string): Promise<number> => {
    const db = getServiceClient();
    if (!db) return 0;
    try {
      const [guardados, interesados] = await Promise.all([
        db
          .from("saved_events")
          .select("*", { count: "exact", head: true })
          .eq("event_slug", slug),
        db
          .from("event_interest")
          .select("*", { count: "exact", head: true })
          .eq("event_slug", slug),
      ]);
      return (guardados.count ?? 0) + (interesados.count ?? 0);
    } catch (err) {
      console.error("[populares] conteo no disponible (no fatal):", err);
      return 0;
    }
  }
);
