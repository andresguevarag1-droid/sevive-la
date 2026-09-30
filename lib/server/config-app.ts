/**
 * Configuración interna clave/valor en Supabase (tabla app_config,
 * migración 0011) — SOLO SERVIDOR. No fatal: sin Supabase o sin la
 * migración aplicada, leer devuelve null y guardar solo avisa.
 */
import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

export async function leerConfig(key: string): Promise<string | null> {
  const db = getServiceClient();
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) return null;
    return data?.value ?? null;
  } catch {
    return null;
  }
}

export async function guardarConfig(key: string, value: string): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  try {
    const { error } = await db
      .from("app_config")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) {
      console.warn(`[config] no se pudo guardar "${key}" (¿falta la migración 0011?):`, error.message);
    }
  } catch (err) {
    console.warn(`[config] no se pudo guardar "${key}":`, err);
  }
}

/**
 * Registro de salud de la conexión con Instagram: los crons de reels e
 * ig-eventos avisan acá cada vez que corren, para que el panel de admin
 * pueda mostrar "el token murió tal día" en vez de que nadie se entere
 * hasta que alguien pregunte por qué dejó de entrar contenido.
 */
export async function marcarSaludInstagram(estado: {
  ok: boolean;
  cron: "reels" | "ig-eventos";
  motivo?: string;
}): Promise<void> {
  const fecha = new Date().toISOString();
  if (estado.ok) {
    await guardarConfig("instagram_ultimo_ok", JSON.stringify({ cron: estado.cron, fecha }));
  } else {
    await guardarConfig(
      "instagram_ultimo_error",
      JSON.stringify({ cron: estado.cron, motivo: estado.motivo ?? "Error desconocido", fecha })
    );
  }
}
