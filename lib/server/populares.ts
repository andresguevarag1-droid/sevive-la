/**
 * Prueba social de eventos: cuántas personas guardaron cada evento en su
 * agenda (saved_events) o pidieron aviso de la próxima edición
 * (event_interest). El dato ya se capturaba y dormía en la base; ahora
 * vende: "N personas lo tienen en su agenda" convierte mejor que
 * cualquier adjetivo y presume tracción ante marcas.
 *
 * cache() de React: una sola consulta por render aunque varios
 * componentes pidan el mapa. Sin Supabase → mapa vacío (nada revienta).
 */
import "server-only";
import { cache } from "react";
import { getServiceClient } from "@/lib/supabase/server";

/** Mínimo para mostrar el dato: un "2 personas" vende en contra. */
export const MIN_PRUEBA_SOCIAL = 3;

export const getGuardadosPorEvento = cache(
  async (): Promise<Map<string, number>> => {
    const mapa = new Map<string, number>();
    const db = getServiceClient();
    if (!db) return mapa;
    try {
      const [{ data: guardados }, { data: interesados }] = await Promise.all([
        db.from("saved_events").select("event_slug").limit(5000),
        db.from("event_interest").select("event_slug").limit(5000),
      ]);
      for (const fila of [...(guardados ?? []), ...(interesados ?? [])] as {
        event_slug: string;
      }[]) {
        mapa.set(fila.event_slug, (mapa.get(fila.event_slug) ?? 0) + 1);
      }
    } catch (err) {
      console.error("[populares] conteo no disponible (no fatal):", err);
    }
    return mapa;
  }
);
