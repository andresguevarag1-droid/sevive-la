/**
 * Participación en CAMPAÑA (ej. Latin Grammys 2026). Reemplaza al Google Form.
 * Flujo: honeypot → Zod → rate-limit → Turnstile → verificar en Sanity que la
 * campaña existe y está ABIERTA → upsert people → consent (texto exacto,
 * versión, IP, UA) → insert campaign_entries (única por correo) → interés.
 *
 * Decisión de negocio (spec §2): si la persona no cumple elegibilidad
 * (21+/pasaporte/visa) IGUAL se captura el lead con sus banderas.
 */
import { NextResponse } from "next/server";
import { participacionSchema } from "@/lib/validation/participacion";
import { consentParticipacion } from "@/lib/consent";
import { getCampana, estadoCampana } from "@/lib/sanity/campana";
import { getServiceClient } from "@/lib/supabase/server";
import {
  upsertPerson,
  recordConsent,
  declareInterest,
} from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { generarCodigoUnico } from "@/lib/server/referral";
import { getBaseUrl } from "@/lib/server/base-url";
import {
  emailEnabled,
  enviarCorreo,
  agregarAAudiencia,
  plantillaParticipacion,
} from "@/lib/server/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const baseUrl = getBaseUrl(req);
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

  const parsed = participacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("participar", ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const humano = await verifyTurnstile(d.turnstileToken, ip);
  if (!humano) {
    return NextResponse.json(
      { ok: false, error: "No pudimos verificar que sos una persona. Recargá e intentá de nuevo." },
      { status: 403 }
    );
  }

  // La campaña debe existir en Sanity y estar dentro de su ventana + activa.
  const campana = await getCampana(d.campaignSlug);
  if (!campana) {
    return NextResponse.json(
      { ok: false, error: "Esta campaña no existe." },
      { status: 404 }
    );
  }
  const estado = estadoCampana(campana);
  if (estado !== "abierta") {
    return NextResponse.json(
      {
        ok: false,
        error:
          estado === "proximamente"
            ? "Esta dinámica todavía no abre."
            : "Esta dinámica ya cerró. ¡Seguinos para la próxima!",
      },
      { status: 409 }
    );
  }

  const db = getServiceClient();
  if (!db) {
    console.error("[participar] Supabase no configurado; lead no persistido.");
    return NextResponse.json(
      { ok: false, error: "Las participaciones están en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  // ── Referidos (Feature A): resolver referred_by y generar código propio ──
  const referidosActivos = campana.referidosActivos !== false;
  let referredBy: string | null = null;
  let referralCode: string | null = null;

  let personaStatus = "active";
  try {
    // 1. La persona entra (o se completa) en la base de audiencia.
    //    (una baja previa del boletín NO se revierte desde aquí)
    const persona = await upsertPerson(db, {
      email: d.email,
      firstName: d.fullName,
      phone: d.phone || undefined,
      source: "dinamica",
    });
    personaStatus = persona.status;

    // 2. Prueba de consentimiento ANTES de la entry (Ley 8968): si algo
    //    falla después, el dato de la persona nunca queda sin su prueba.
    await recordConsent(db, persona.id, consentParticipacion(campana.slug), {
      ip,
      userAgent,
    });

    if (referidosActivos && d.ref) {
      // El código debe pertenecer a OTRA persona de la MISMA campaña.
      // Inválido o self-referral → null, sin bloquear la participación.
      const { data: referrer } = await db
        .from("campaign_entries")
        .select("email")
        .eq("campaign_slug", d.campaignSlug)
        .eq("referral_code", d.ref)
        .maybeSingle();
      if (referrer && referrer.email !== d.email) referredBy = d.ref;
    }

    // 3. Lead de campaña: única por correo. Si el 23505 viene del código de
    //    referido (colisión astronómica pero posible), se reintenta con otro.
    const insertarEntry = async (codigo: string | null) =>
      db.from("campaign_entries").insert({
        campaign_slug: d.campaignSlug,
        person_id: persona.id,
        email: d.email,
        full_name: d.fullName,
        residence: d.residence,
        phone: d.phone || null,
        is_over_21: d.isOver21,
        has_passport: d.hasPassport,
        has_us_visa: d.hasUsVisa,
        follows_ig: d.followsIg ?? false,
        utm: d.utm ?? {},
        referral_code: codigo,
        referred_by: referredBy,
      });

    let entryErr = null;
    for (let intento = 0; intento < 2; intento++) {
      referralCode = referidosActivos ? await generarCodigoUnico(db) : null;
      const { error } = await insertarEntry(referralCode);
      entryErr = error;
      const esColisionDeCodigo =
        error?.code === "23505" &&
        `${error.message ?? ""}${error.details ?? ""}`.includes("referral_code");
      if (!esColisionDeCodigo) break;
    }

    if (entryErr) {
      if (entryErr.code === "23505") {
        // Ya participaba: devolver su código existente para que vea su link.
        const { data: existente } = await db
          .from("campaign_entries")
          .select("referral_code")
          .eq("campaign_slug", d.campaignSlug)
          .eq("email", d.email)
          .maybeSingle();
        const codigo = existente?.referral_code ?? null;
        return NextResponse.json({
          ok: true,
          yaParticipaba: true,
          referralCode: codigo,
          referralUrl: codigo
            ? `${baseUrl}/dinamicas/${d.campaignSlug}?ref=${codigo}`
            : null,
        });
      }
      throw entryErr;
    }

    // 4. Interés declarado en la vertical de la campaña (weight 3).
    await declareInterest(db, persona.id, campana.vertical, 3);
  } catch (err) {
    console.error("[participar] error guardando lead:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos registrar tu participación. Intentá de nuevo." },
      { status: 500 }
    );
  }

  // Correo de confirmación + audiencia: no-fatal (el lead ya está en Supabase).
  // A las personas dadas de baja no se les reescribe ni se les re-agrega.
  if (emailEnabled && personaStatus !== "unsubscribed") {
    try {
      await enviarCorreo(d.email, plantillaParticipacion(d.email, campana.titulo));
      await agregarAAudiencia(d.email, d.fullName);
    } catch (err) {
      console.error("[participar] correo/audiencia falló (no fatal):", err);
    }
  }

  const eligible = d.isOver21 && d.hasPassport && d.hasUsVisa;
  return NextResponse.json({
    ok: true,
    eligible,
    referralCode,
    referralUrl: referralCode
      ? `${baseUrl}/dinamicas/${d.campaignSlug}?ref=${referralCode}`
      : null,
  });
}
