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
