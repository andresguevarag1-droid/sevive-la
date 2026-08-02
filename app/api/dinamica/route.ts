/**
 * Participación en una dinámica. Flujo (Sección 9.2 del documento maestro):
 * honeypot → Zod → rate-limit → Turnstile → verificar en Sanity que la
 * dinámica existe y está ABIERTA (no se confía en el cliente) → upsert people
 * → upsert dynamics → insert entries (única por persona) → consentimiento
 * (texto exacto + versión + IP + UA) → interés declarado (weight 3).
 * NUNCA se cobra por participar.
 */
import { NextResponse } from "next/server";
import { dinamicaEntrySchema } from "@/lib/validation/dinamica";
import { consentDinamica } from "@/lib/consent";
import { getDinamica, estadoDinamica } from "@/lib/sanity/dinamica";
import { getServiceClient } from "@/lib/supabase/server";
import {
  upsertPerson,
  recordConsent,
  declareInterest,
} from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/** Garantiza la fila de `dynamics` (metadatos desde Sanity) y devuelve su id. */
async function ensureDynamicRow(
  db: SupabaseClient,
  d: { slug: string; title: string; vertical: string; inicio: string; cierre: string }
): Promise<string> {
  const { data, error } = await db
    .from("dynamics")
    .upsert(
      {
        slug: d.slug,
        title: d.title,
        vertical: d.vertical,
        starts_at: d.inicio,
        ends_at: d.cierre,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo inválido." },
      { status: 400 }
    );
  }

  // Honeypot: si un bot llenó el campo oculto, fingir éxito y no guardar nada.
  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    (body as { website?: unknown }).website
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = dinamicaEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("dinamica", ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const humano = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!humano) {
    return NextResponse.json(
      { ok: false, error: "No pudimos verificar que sos una persona. Recargá e intentá de nuevo." },
      { status: 403 }
    );
  }

  // La dinámica debe existir en Sanity y estar dentro de su ventana.
  const dinamica = await getDinamica(parsed.data.slug);
  if (!dinamica) {
    return NextResponse.json(
      { ok: false, error: "Esta dinámica no existe." },
      { status: 404 }
    );
  }
  const estado = estadoDinamica(dinamica);
  if (estado !== "abierta") {
    return NextResponse.json(
      {
        ok: false,
        error:
          estado === "proximamente"
            ? "Esta dinámica todavía no abre."
            : "Esta dinámica ya cerró.",
      },
      { status: 409 }
    );
  }

  const db = getServiceClient();
  if (!db) {
    console.error("[dinamica] Supabase no configurado; participación no persistida.");
    return NextResponse.json(
      { ok: false, error: "Las participaciones están en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  try {
    const { id: personId } = await upsertPerson(db, {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      phone: parsed.data.phone || undefined,
      source: "dinamica",
    });

    // Consentimiento ANTES de la entry: la PII nunca queda sin su prueba
    // (Ley 8968), ni siquiera si un reintento cae en el camino de duplicado.
    await recordConsent(db, personId, consentDinamica(dinamica.slug), {
      ip,
      userAgent,
    });

    const dynamicId = await ensureDynamicRow(db, dinamica);

    // Una participación por persona: el unique (dynamic_id, person_id) manda.
    const { error: entryErr } = await db.from("entries").insert({
      dynamic_id: dynamicId,
      person_id: personId,
      answers: parsed.data.answer ? { respuesta: parsed.data.answer } : null,
    });
    if (entryErr) {
      if (entryErr.code === "23505") {
        // Ya estaba participando: no es un error para la persona.
        return NextResponse.json({ ok: true, yaParticipaba: true });
      }
      throw entryErr;
    }

    await declareInterest(db, personId, dinamica.vertical, 3);
  } catch (err) {
    console.error("[dinamica] error guardando participación:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos registrar tu participación. Intentá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
