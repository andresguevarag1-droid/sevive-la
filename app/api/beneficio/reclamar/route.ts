/**
 * Emite un cupón único de beneficio (Feature B).
 * Flujo: honeypot → Zod → rate-limit → Turnstile → beneficio vigente en
 * Sanity → upsert persona → consentimiento → cupón idempotente por
 * (beneficio, correo) → email con el cupón (no fatal).
 */
import { NextResponse } from "next/server";
import { reclamarSchema } from "@/lib/validation/beneficio";
import { consentBeneficio } from "@/lib/consent";
import { getBeneficio, beneficioVigente } from "@/lib/sanity/beneficio";
import { getServiceClient } from "@/lib/supabase/server";
import { upsertPerson, recordConsent, declareInterest } from "@/lib/server/capture";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { generarCodigoCuponUnico } from "@/lib/server/coupon";
import { emailEnabled, enviarCorreo, plantillaCupon } from "@/lib/server/email";
import { getBaseUrl } from "@/lib/server/base-url";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const baseUrl = getBaseUrl(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  // Honeypot: fingir éxito ante bots.
  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    (body as { website?: unknown }).website
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = reclamarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  const { allowed } = await checkRateLimit("cupon", ip);
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

  const beneficio = await getBeneficio(d.benefitSlug);
  if (!beneficio || !beneficio.cuponMedible) {
    return NextResponse.json(
      { ok: false, error: "Este beneficio no está disponible." },
      { status: 404 }
    );
  }
  if (!beneficioVigente(beneficio)) {
    return NextResponse.json(
      { ok: false, error: "Este beneficio ya venció." },
      { status: 409 }
    );
  }

  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, error: "Los cupones están en configuración. Intentá más tarde." },
      { status: 503 }
    );
  }

  // Cupo máximo (si el editor lo definió): la promesa de "quedan N" se
  // cumple en el servidor, no solo en la tarjeta. Quien ya tiene cupón
  // puede recuperarlo aunque el cupo esté lleno (flujo idempotente).
  if (beneficio.cupoMaximo) {
    const { count } = await db
      .from("coupons")
      .select("id", { count: "exact", head: true })
      .eq("benefit_slug", d.benefitSlug);
    if ((count ?? 0) >= beneficio.cupoMaximo) {
      const { data: propio } = await db
        .from("coupons")
        .select("code")
        .eq("benefit_slug", d.benefitSlug)
        .eq("email", d.email)
        .maybeSingle();
      if (!propio) {
        return NextResponse.json(
          { ok: false, error: "Se agotaron los cupones de este beneficio." },
          { status: 409 }
        );
      }
    }
  }

  try {
    const { id: personId } = await upsertPerson(db, {
      email: d.email,
      source: "beneficio",
    });

    // Consentimiento ANTES del cupón: la PII nunca queda sin su prueba.
    await recordConsent(db, personId, consentBeneficio(d.benefitSlug), {
      ip,
      userAgent,
    });

    // Idempotente: si ya tiene cupón de este beneficio, devolver el mismo.
    const { data: existente } = await db
      .from("coupons")
      .select("code, status")
      .eq("benefit_slug", d.benefitSlug)
      .eq("email", d.email)
      .maybeSingle();

    let code: string;
    let recienEmitido = false;
    if (existente) {
      code = existente.code as string;
    } else {
      const expiresAt = beneficio.vigencia
        ? new Date(`${beneficio.vigencia}T23:59:59-06:00`).toISOString()
        : null;
      const insertar = async (c: string) =>
        db.from("coupons").insert({
          benefit_slug: d.benefitSlug,
          email: d.email,
          person_id: personId,
          code: c,
          source: d.utm ?? {},
          expires_at: expiresAt,
        });

      code = await generarCodigoCuponUnico(db);
      let insErr = null;
      for (let intento = 0; intento < 2; intento++) {
        const { error } = await insertar(code);
        insErr = error;
        // Colisión del código único (no del par beneficio+correo): otro código.
        const esColisionDeCodigo =
          error?.code === "23505" &&
          `${error.message ?? ""}${error.details ?? ""}`.includes("coupons_code");
        if (!esColisionDeCodigo) break;
        code = await generarCodigoCuponUnico(db);
      }
      if (insErr) {
        if (insErr.code === "23505") {
          // Carrera: otro request lo emitió — recuperar el existente.
          const { data: otra } = await db
            .from("coupons")
            .select("code")
            .eq("benefit_slug", d.benefitSlug)
            .eq("email", d.email)
            .maybeSingle();
          if (!otra) throw insErr;
          code = otra.code as string;
        } else {
          throw insErr;
        }
      } else {
        recienEmitido = true;
      }

      await declareInterest(db, personId, beneficio.vertical, 3);
    }

    const url = `${baseUrl}/mi-cupon/${code}`;

    // Email con el cupón: no fatal, y SOLO al emitirlo por primera vez
    // (reintentar el form no debe spamear "tu cupón está listo").
    if (emailEnabled && recienEmitido) {
      try {
        await enviarCorreo(
          d.email,
          plantillaCupon(d.email, {
            titulo: beneficio.title,
            marca: beneficio.marca,
            detalle: beneficio.detalle,
            code,
            url,
            vigencia: beneficio.vigencia,
          })
        );
      } catch (err) {
        console.error("[cupon] correo falló (no fatal):", err);
      }
    }

    return NextResponse.json({ ok: true, code, url, yaTenia: Boolean(existente) });
  } catch (err) {
    console.error("[cupon] error emitiendo:", err);
    return NextResponse.json(
      { ok: false, error: "No pudimos emitir tu cupón. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
