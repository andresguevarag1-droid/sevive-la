/**
 * Alta al boletín. Flujo (Sección 9.1 del documento maestro):
 * honeypot → Zod → rate-limit → Turnstile → upsert people →
 * registro de consentimiento (texto exacto + versión + IP + UA) →
 * doble opt-in por email (Resend) cuando está configurado.
 * El guardado en Supabase es la fuente de verdad: si Resend falla,
 * el lead NO se pierde.
 */
import { NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/validation/subscribe";
import { CONSENT_NEWSLETTER } from "@/lib/consent";
import { getServiceClient } from "@/lib/supabase/server";
import {
  upsertPerson,
  recordConsent,
  saveAttribution,
  declareInterest,
} from "@/lib/server/capture";
import { verticals } from "@/lib/site";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import {
  emailEnabled,
  plantillaConfirmacionBoletin,
  plantillaBienvenidaBoletin,
  enviarCorreo,
  agregarAAudiencia,
} from "@/lib/server/email";

export const runtime = "nodejs";

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

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("subscribe", ip);
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
    // Supabase aún no configurado en este entorno: no perder la UX con un 500.
    console.error("[subscribe] Supabase no configurado; alta no persistida.");
    return NextResponse.json(
      { ok: false, error: "El boletín está en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  // Doble opt-in solo si podemos mandar el correo de confirmación firmado.
  const plantillaConfirmacion = plantillaConfirmacionBoletin(parsed.data.email);
  const dobleOptIn = emailEnabled && plantillaConfirmacion !== null;

  let persona;
  try {
    persona = await upsertPerson(db, {
      email: parsed.data.email,
      firstName: parsed.data.firstName || undefined,
      source: "boletin",
      initialStatus: dobleOptIn ? "pending" : "active",
      // Una persona dada de baja que vuelve a suscribirse: re-alta legítima
      // (con re-confirmación si hay doble opt-in).
      reactivateTo: dobleOptIn ? "pending" : "active",
    });
    await recordConsent(db, persona.id, CONSENT_NEWSLETTER, { ip, userAgent });
    // Qué canal trajo a esta persona (el argumento de venta ante marcas).
    await saveAttribution(db, persona.id, parsed.data.utm);
    // Chips marcados al suscribirse = interés declarado (peso máximo),
    // filtrados contra la lista real de verticales.
    const validas = new Set(verticals.map((v) => v.slug));
    for (const s of parsed.data.intereses ?? []) {
      if (validas.has(s as (typeof verticals)[number]["slug"])) {
        await declareInterest(db, persona.id, s);
      }
    }
  } catch (err) {
    console.error("[subscribe] error guardando en Supabase:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos completar tu alta. Intentá de nuevo." },
      { status: 500 }
    );
  }

  // Correos: no-fatales (la persona ya quedó registrada con su consentimiento).
  try {
    if (persona.status === "pending" && plantillaConfirmacion) {
      // Doble opt-in: confirmar antes de activar.
      await enviarCorreo(parsed.data.email, plantillaConfirmacion);
    } else if (emailEnabled) {
      // Alta directa: bienvenida + audiencia.
      if (persona.created) {
        await enviarCorreo(
          parsed.data.email,
          plantillaBienvenidaBoletin(parsed.data.email)
        );
      }
      await agregarAAudiencia(
        parsed.data.email,
        parsed.data.firstName || undefined
      );
    }
  } catch (err) {
    console.error("[subscribe] correo/audiencia falló (no fatal):", err);
  }

  return NextResponse.json({ ok: true, confirmar: persona.status === "pending" });
}
