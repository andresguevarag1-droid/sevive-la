/**
 * Cliente de Supabase para el SERVIDOR (service role).
 * ⚠️ SOLO importar desde route handlers / server actions. El import de
 * "server-only" hace fallar el build si alguien lo trae a un componente cliente.
 *
 * Devuelve null cuando las variables de entorno no están configuradas,
 * para que los endpoints degraden con un mensaje claro en vez de reventar.
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/** true cuando Supabase está listo para escribir desde el servidor. */
export const supabaseConfigured = Boolean(url && serviceRoleKey);

export function getServiceClient(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  if (!cached) {
    cached = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
