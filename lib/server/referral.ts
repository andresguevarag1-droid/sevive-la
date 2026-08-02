/**
 * Códigos de referido: cortos, legibles y sin caracteres ambiguos (0/O/1/I/L).
 * Se generan en el servidor y se garantiza unicidad reintentando en colisión.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars, sin ambigüedades

export function generarCodigo(largo = 8): string {
  const bytes = randomBytes(largo);
  let code = "";
  for (let i = 0; i < largo; i++) {
    code += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return code;
}

/** Genera un referral_code que no exista todavía (reintenta en colisión). */
export async function generarCodigoUnico(
  db: SupabaseClient,
  intentos = 5
): Promise<string> {
  for (let i = 0; i < intentos; i++) {
    const code = generarCodigo();
    const { data } = await db
      .from("campaign_entries")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  // Colisiones 5 veces seguidas es astronómicamente improbable (31^8 ≈ 852 mil millones).
  throw new Error("No se pudo generar un código de referido único.");
}
