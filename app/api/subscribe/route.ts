/**
 * Alta al boletín. Flujo (Sección 9.1 del documento maestro):
 * honeypot → Zod → rate-limit → Turnstile → upsert people →
 * registro de consentimiento (texto exacto + versión + IP + UA) → Resend.
 */
import { NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/validation/subscribe";
import { CONSENT_NEWSLETTER } from "@/lib/consent";
import { getServiceClient } from "@/lib/supabase/server";
import { upsertPerson, recordConsent } from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";

async function addToResend(email: string, firstName?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return;
  // Import dinámico: el SDK solo se carga si Resend está configurado.
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.contacts.create({
    email,
    firstName: firstName || undefined,
    audienceId,
    unsubscribed: false,
  });
  if (error) throw new Error(error.message);
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

  try {
    const personId = await upsertPerson(db, {
      email: parsed.data.email,
      firstName: parsed.data.firstName || undefined,
      source: "boletin",
    });
    await recordConsent(db, personId, CONSENT_NEWSLETTER, { ip, userAgent });
  } catch (err) {
    console.error("[subscribe] error guardando en Supabase:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos completar tu alta. Intentá de nuevo." },
      { status: 500 }
    );
  }

  // Alta en Resend: no-fatal (la persona ya quedó registrada con su consentimiento).
  try {
    await addToResend(parsed.data.email, parsed.data.firstName || undefined);
  } catch (err) {
    console.error("[subscribe] alta en Resend falló (no fatal):", err);
  }

  return NextResponse.json({ ok: true });
}
