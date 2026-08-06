/**
 * Respaldo de "Mi agenda": liga los eventos guardados del dispositivo a una
 * persona identificada por correo. Flujo: honeypot → Zod → rate-limit →
 * Turnstile → upsert people → consentimiento auditado (Ley 8968) → interés
 * por vertical → upsert de saved_events (idempotente por persona+evento).
 */
import { NextResponse } from "next/server";
import { respaldoAgendaSchema } from "@/lib/validation/agenda";
import { CONSENT_AGENDA } from "@/lib/consent";
import { getServiceClient } from "@/lib/supabase/server";
import { upsertPerson, recordConsent, declareInterest } from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import {
  emailEnabled,
  enviarCorreo,
  plantillaConfirmarCorreo,
} from "@/lib/server/email";

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

  const parsed = respaldoAgendaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("agenda-respaldo", ip);
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

  const db = getServiceClient();
  if (!db) {
    console.error("[agenda] Supabase no configurado; respaldo no persistido.");
    return NextResponse.json(
      { ok: false, error: "Estamos en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  // true cuando se envió correo de confirmación (la UI lo anuncia).
  let confirmar = false;
  try {
    // Titularidad no verificada = 'pending': los crons de correo solo
    // escriben a personas 'active' (nadie puede inscribir correos ajenos).
    const persona = await upsertPerson(db, {
      email: parsed.data.email,
      source: "agenda",
      initialStatus: "pending",
    });
    await recordConsent(db, persona.id, CONSENT_AGENDA, { ip, userAgent });
    if (persona.status === "pending" && emailEnabled) {
      try {
        const plantilla = plantillaConfirmarCorreo(
          parsed.data.email,
          "Alguien (ojalá vos) respaldó su agenda de SeViveLa con este correo. Confirmá para activar los recordatorios de tus planes."
        );
        if (plantilla) {
          await enviarCorreo(parsed.data.email, plantilla);
          confirmar = true;
        }
      } catch (err) {
        console.error("[agenda] confirmación falló (no fatal):", err);
      }
    }

    // Cada vertical guardada es interés declarado (peso máximo).
    const verticales = [...new Set(parsed.data.items.map((i) => i.vertical))];
    for (const v of verticales) await declareInterest(db, persona.id, v);

    const filas = parsed.data.items.map((i) => ({
      person_id: persona.id,
      event_slug: i.slug,
      event_title: i.title,
      inicio:
        i.inicio && !Number.isNaN(new Date(i.inicio).getTime())
          ? new Date(i.inicio).toISOString()
          : null,
      lugar: i.lugar || null,
      vertical: i.vertical,
    }));
    const { error } = await db
      .from("saved_events")
      .upsert(filas, { onConflict: "person_id,event_slug" });
    if (error) throw error;
  } catch (err) {
    console.error("[agenda] error guardando en Supabase:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos respaldar tu agenda. Intentá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, respaldados: parsed.data.items.length, confirmar });
}
