/**
 * Códigos de cupón: legibles (SV-XXXX-XXXX), no adivinables (aleatorio con
 * sal del servidor) y sin caracteres ambiguos. Unicidad garantizada por la
 * constraint de la tabla + reintento.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function salt(): string {
  return (
    process.env.COUPON_CODE_SALT ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sevivela"
  );
}

export function generarCodigoCupon(): string {
  // Aleatorio + sal → hash → mapear al alfabeto legible.
  const hash = createHash("sha256")
    .update(randomBytes(16))
    .update(salt())
    .digest();
  let cuerpo = "";
  for (let i = 0; i < 8; i++) {
    cuerpo += ALFABETO[hash[i] % ALFABETO.length];
  }
  return `SV-${cuerpo.slice(0, 4)}-${cuerpo.slice(4)}`;
}

export async function generarCodigoCuponUnico(
  db: SupabaseClient,
  intentos = 5
): Promise<string> {
  for (let i = 0; i < intentos; i++) {
    const code = generarCodigoCupon();
    const { data } = await db
      .from("coupons")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("No se pudo generar un código de cupón único.");
}

/** Hash del token de local (se compara contra venues.token_hash). */
export function hashVenueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
