/**
 * "Avisame de la próxima edición": captura de interés en un evento pasado.
 * Flujo: honeypot → Zod → rate-limit → Turnstile → evento verificado en
 * Sanity → upsert people → consentimiento auditado (Ley 8968) → interés
 * por vertical → fila en event_interest (audiencia segmentada por evento).
 */
import { NextResponse } from "next/server";
import { interesEventoSchema } from "@/lib/validation/interes-evento";
import { consentInteresEvento } from "@/lib/consent";
import { getEvento } from "@/lib/sanity/evento";
import { getServiceClient } from "@/lib/supabase/server";
import { upsertPerson, recordConsent, declareInterest } from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
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

  const parsed = interesEventoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("interes-evento", ip);
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

  // El evento es la fuente de verdad del título y la vertical (nunca el cliente).
  const evento = await getEvento(parsed.data.eventSlug);
  if (!evento) {
    return NextResponse.json(
      { ok: false, error: "No encontramos este evento." },
      { status: 404 }
    );
  }

  const db = getServiceClient();
  if (!db) {
    console.error("[interes-evento] Supabase no configurado; interés no persistido.");
    return NextResponse.json(
      { ok: false, error: "Estamos en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  try {
    const persona = await upsertPerson(db, {
      email: parsed.data.email,
      firstName: parsed.data.firstName || undefined,
      source: "interes-evento",
    });
    await recordConsent(db, persona.id, consentInteresEvento(evento.slug), {
      ip,
      userAgent,
    });
    await declareInterest(db, persona.id, evento.vertical);
    // Idempotente: repetir el registro del mismo evento no duplica ni falla.
    const { error } = await db.from("event_interest").upsert(
      {
        person_id: persona.id,
        event_slug: evento.slug,
        event_title: evento.title,
        vertical: evento.vertical,
        utm: parsed.data.utm ?? null,
      },
      { onConflict: "person_id,event_slug" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("[interes-evento] error guardando en Supabase:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos guardar tu interés. Intentá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
