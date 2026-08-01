/**
 * Capa de captura de datos first-party (núcleo del negocio).
 * Operaciones sobre Supabase con el service role: upsert de persona,
 * registro inmutable de consentimiento y declaración de intereses.
 * Solo se usa desde route handlers del servidor.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConsentDefinition } from "@/lib/consent";

export type PersonInput = {
  email: string;
  firstName?: string;
  phone?: string;
  /** 'boletin' | 'dinamica' | ... — solo se fija al crear la persona. */
  source: string;
};

/**
 * Crea o actualiza la persona por email y devuelve su id.
 * Idempotente: un segundo alta con el mismo correo no duplica ni pisa
 * el `source` original; solo completa nombre/teléfono si faltaban.
 */
export async function upsertPerson(
  db: SupabaseClient,
  input: PersonInput
): Promise<string> {
  const { data: existing, error: findErr } = await db
    .from("people")
    .select("id, first_name, phone, status")
    .eq("email", input.email)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.first_name && input.firstName) patch.first_name = input.firstName;
    if (!existing.phone && input.phone) patch.phone = input.phone;
    // Reactivar si estaba de baja y vuelve a dejarnos sus datos.
    if (existing.status === "unsubscribed") patch.status = "active";
    if (Object.keys(patch).length > 0) {
      const { error } = await db.from("people").update(patch).eq("id", existing.id);
      if (error) throw error;
    }
    return existing.id as string;
  }

  const { data: created, error: insErr } = await db
    .from("people")
    .insert({
      email: input.email,
      first_name: input.firstName || null,
      phone: input.phone || null,
      source: input.source,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id as string;
}

/** Registra la prueba de consentimiento (texto exacto, versión, IP, UA). */
export async function recordConsent(
  db: SupabaseClient,
  personId: string,
  consent: ConsentDefinition,
  meta: { ip: string | null; userAgent: string | null }
): Promise<void> {
  const { error } = await db.from("consents").insert({
    person_id: personId,
    purpose: consent.purpose,
    consent_text: consent.text,
    consent_version: consent.version,
    granted: true,
    ip: meta.ip,
    user_agent: meta.userAgent,
  });
  if (error) throw error;
}

/** Declara interés en una vertical (declarado = weight 3, el máximo). */
export async function declareInterest(
  db: SupabaseClient,
  personId: string,
  vertical: string,
  weight = 3
): Promise<void> {
  const { error } = await db.from("person_interests").upsert(
    { person_id: personId, vertical, weight },
    { onConflict: "person_id,vertical" }
  );
  if (error) throw error;
}
