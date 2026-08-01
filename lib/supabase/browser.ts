/**
 * Cliente de Supabase para el NAVEGADOR (anon key).
 * Con RLS activo y sin políticas públicas, este cliente NO puede tocar datos
 * de personas: solo sirve para lecturas públicas explícitas (ej. el RPC
 * `dynamic_entry_count`). Devuelve null si no está configurado.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
