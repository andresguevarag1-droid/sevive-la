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
  /**
   * Reactivar a una persona dada de baja SOLO cuando vuelve a suscribirse
   * al boletín (nunca desde dinámicas/cupones: sería spam sin consentimiento
   * para ese fin). 'pending' cuando hay doble opt-in.
   */
  reactivateTo?: "active" | "pending";
};

export type UpsertResult = {
  id: string;
  /** true si la persona es nueva (primer contacto con SeViveLa). */
  created: boolean;
  status: string;
};

/**
 * Crea o actualiza la persona por email y devuelve su id.
 * Idempotente: un segundo alta con el mismo correo no duplica ni pisa
 * el `source` original; solo completa nombre/teléfono si faltaban.
 */
export async function upsertPerson(
  db: SupabaseClient,
  input: PersonInput & { initialStatus?: "active" | "pending" }
): Promise<UpsertResult> {
  const buscar = () =>
    db
      .from("people")
      .select("id, first_name, phone, status")
      .eq("email", input.email)
      .maybeSingle();

  const { data: found, error: findErr } = await buscar();
  if (findErr) throw findErr;
  let existing = found;

  if (!existing) {
    let status = input.initialStatus ?? "active";
    let inserted = await db
      .from("people")
      .insert({
        email: input.email,
        first_name: input.firstName || null,
        phone: input.phone || null,
        source: input.source,
        status,
      })
      .select("id")
      .single();
    // Si la migración 0003 (status 'pending') aún no se aplicó, degradar a 'active'.
    if (inserted.error?.code === "23514" && status === "pending") {
      status = "active";
      inserted = await db
        .from("people")
        .insert({
          email: input.email,
          first_name: input.firstName || null,
          phone: input.phone || null,
          source: input.source,
          status,
        })
        .select("id")
        .single();
    }
    if (!inserted.error) {
      return { id: inserted.data.id as string, created: true, status };
    }
    if (inserted.error.code !== "23505") throw inserted.error;
    // Carrera (doble tap): otro request creó a la persona — recuperarla.
    const { data: again, error: againErr } = await buscar();
    if (againErr) throw againErr;
    if (!again) throw inserted.error;
    existing = again;
  }

  const patch: Record<string, unknown> = {};
  if (!existing.first_name && input.firstName) patch.first_name = input.firstName;
  if (!existing.phone && input.phone) patch.phone = input.phone;
  // La baja se respeta: solo el flujo del boletín puede reactivar.
  if (existing.status === "unsubscribed" && input.reactivateTo) {
    patch.status = input.reactivateTo;
  }
  if (Object.keys(patch).length > 0) {
    const { error } = await db.from("people").update(patch).eq("id", existing.id);
    if (error) throw error;
  }
  return {
    id: existing.id as string,
    created: false,
    status: (patch.status as string) ?? (existing.status as string),
  };
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
