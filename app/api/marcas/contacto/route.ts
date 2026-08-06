/**
 * Lead comercial de "Para marcas": honeypot → Zod → rate-limit → Turnstile
 * → fila en brand_leads (pipeline de ventas). Si Resend está activo,
 * avisa por correo al equipo para responder rápido.
 */
import { NextResponse } from "next/server";
import { marcaLeadSchema } from "@/lib/validation/marcas";
import { getServiceClient } from "@/lib/supabase/server";
import { getClientIp, getUserAgent } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { emailEnabled, enviarCorreo } from "@/lib/server/email";
import { site } from "@/lib/site";

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

  const parsed = marcaLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit("marcas-contacto", ip);
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
    console.error("[marcas] Supabase no configurado; lead no persistido.");
    return NextResponse.json(
      { ok: false, error: "Estamos en configuración. Escribinos a hola@" + site.domain },
      { status: 503 }
    );
  }

  const d = parsed.data;
  const { error } = await db.from("brand_leads").insert({
    brand_name: d.brandName,
    contact_name: d.contactName,
    email: d.email,
    phone: d.phone || null,
    interest: d.interest ?? null,
    message: d.message || null,
    utm: d.utm && Object.keys(d.utm).length > 0 ? d.utm : null,
  });
  if (error) {
    console.error("[marcas] error guardando lead:", error, "UA:", getUserAgent(req));
    return NextResponse.json(
      { ok: false, error: "No pudimos enviar tu consulta. Intentá de nuevo." },
      { status: 500 }
    );
  }

  // Aviso interno (no fatal): que el equipo responda mientras está caliente.
  if (emailEnabled) {
    try {
      await enviarCorreo(`hola@${site.domain}`, {
        subject: `Nueva marca interesada: ${d.brandName}`,
        html: `<p><strong>${d.brandName}</strong> — ${d.contactName} (${d.email}${
          d.phone ? `, ${d.phone}` : ""
        })</p><p>Formato: ${d.interest ?? "sin definir"}</p><p>${
          d.message ? d.message.replace(/</g, "&lt;") : "Sin mensaje."
        }</p>`,
      });
    } catch (err) {
      console.error("[marcas] aviso interno falló (no fatal):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
