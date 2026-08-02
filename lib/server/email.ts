/**
 * Email transaccional y audiencia (Resend) — SOLO SERVIDOR.
 * Regla de oro: el guardado en Supabase es la fuente de verdad; si Resend
 * falla, el lead NUNCA se pierde (todas las llamadas van en try/catch en
 * los route handlers). Degrada en silencio si faltan las env vars.
 *
 * Links firmados (confirmación / baja): HMAC-SHA256 del correo con
 * EMAIL_LINK_SECRET (fallback: derivado de SUPABASE_SERVICE_ROLE_KEY,
 * que ya es secreto y estable). Sin estado extra en la base.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/lib/site";

const apiKey = process.env.RESEND_API_KEY;
const audienceId = process.env.RESEND_AUDIENCE_ID;
const FROM =
  process.env.RESEND_FROM || `${site.name} <boletin@${site.domain}>`;

/** true cuando se pueden enviar correos. */
export const emailEnabled = Boolean(apiKey);

function linkSecret(): string | null {
  return (
    process.env.EMAIL_LINK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

/** Firma un correo para links de confirmación/baja. null si no hay secreto. */
export function firmarEmail(email: string): string | null {
  const secret = linkSecret();
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function verificarFirma(email: string, token: string): boolean {
  // Solo hex de 32: evita RangeError de timingSafeEqual con multibyte.
  if (!/^[a-f0-9]{32}$/.test(token)) return false;
  const esperada = firmarEmail(email);
  if (!esperada) return false;
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(token));
}

/** URL absoluta de un endpoint con email+token firmado. */
function linkFirmado(path: string, email: string): string | null {
  const token = firmarEmail(email);
  if (!token) return null;
  const url = new URL(path, site.url);
  url.searchParams.set("e", Buffer.from(email.toLowerCase()).toString("base64url"));
  url.searchParams.set("t", token);
  return url.toString();
}

export const linkConfirmar = (email: string) => linkFirmado("/api/confirmar", email);
export const linkBaja = (email: string) => linkFirmado("/api/baja", email);

/* ── Plantillas (español, colores de marca, HTML simple que rinde en todo cliente) ── */

function layoutHtml(cuerpo: string, email: string): string {
  const baja = linkBaja(email);
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f2fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1526;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#a190d2;border-radius:14px 14px 0 0;padding:18px 28px;">
      <strong style="letter-spacing:2px;font-size:14px;color:#1a1526;">SEVIVELA</strong>
    </div>
    <div style="background:#ffffff;border-radius:0 0 14px 14px;padding:28px;">
      ${cuerpo}
    </div>
    <p style="font-size:12px;color:#666174;margin-top:16px;line-height:1.6;">
      Recibiste este correo porque dejaste tus datos en ${site.url.replace("https://", "")}.
      ${baja ? `<a href="${baja}" style="color:#666174;">Darme de baja</a> ·` : ""}
      <a href="${site.url}/legal/privacidad" style="color:#666174;">Privacidad</a>
    </p>
  </div></body></html>`;
}

const btn = (href: string, texto: string) =>
  `<a href="${href}" style="display:inline-block;background:#c71e70;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;margin:18px 0;">${texto}</a>`;

export function plantillaConfirmacionBoletin(email: string): {
  subject: string;
  html: string;
} | null {
  const confirmar = linkConfirmar(email);
  if (!confirmar) return null;
  return {
    subject: "Confirmá tu suscripción al boletín de SeViveLa",
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Ya casi estás dentro.</h1>
       <p style="line-height:1.6;margin:0 0 6px;">Tocá el botón para confirmar tu correo y empezar a recibir, cada jueves, los mejores planes del fin de semana en Costa Rica.</p>
       ${btn(confirmar, "Confirmar mi suscripción")}
       <p style="font-size:13px;color:#666174;line-height:1.6;margin:0;">Si no fuiste vos, ignorá este correo y no te suscribiremos.</p>`,
      email
    ),
  };
}

export function plantillaBienvenidaBoletin(email: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "¡Listo! Ya estás en el boletín de SeViveLa",
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Bienvenido(a) a la lista.</h1>
       <p style="line-height:1.6;margin:0;">El próximo jueves te llega tu primer boletín: eventos, aperturas y beneficios curados por la redacción. Sin relleno.</p>`,
      email
    ),
  };
}

export function plantillaParticipacion(
  email: string,
  tituloCampana: string
): { subject: string; html: string } {
  return {
    subject: `¡Ya estás participando! · ${tituloCampana}`,
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">¡Ya estás participando! 🎉</h1>
       <p style="line-height:1.6;margin:0 0 6px;">Registramos tu participación en <strong>${tituloCampana}</strong>. Si resultás ganador(a), te contactamos a este correo.</p>
       ${btn("https://www.instagram.com/sevive.la", "Seguir a @sevive.la")}
       <p style="font-size:13px;color:#666174;line-height:1.6;margin:0;">La participación es gratuita. Consultá las bases en ${site.url.replace("https://", "")}.</p>`,
      email
    ),
  };
}

export function plantillaCupon(
  email: string,
  cupon: {
    titulo: string;
    marca: string;
    detalle: string;
    code: string;
    url: string;
    vigencia?: string;
  }
): { subject: string; html: string } {
  return {
    subject: `Tu cupón: ${cupon.titulo} · ${cupon.marca}`,
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Tu cupón está listo.</h1>
       <p style="line-height:1.6;margin:0 0 6px;"><strong>${cupon.titulo}</strong> — ${cupon.marca}<br/>${cupon.detalle}</p>
       <p style="background:#f6f2fb;border:1px dashed #a190d2;border-radius:12px;padding:16px;text-align:center;font-size:24px;font-weight:800;letter-spacing:2px;margin:18px 0;">${cupon.code}</p>
       ${btn(cupon.url, "Ver mi cupón (con QR)")}
       <p style="font-size:13px;color:#666174;line-height:1.6;margin:0;">Mostrá el código o el QR en el local. Un solo uso por persona.${cupon.vigencia ? ` Válido hasta el ${cupon.vigencia}.` : ""}</p>`,
      email
    ),
  };
}

/* ── Envío y audiencia ── */

export async function enviarCorreo(
  to: string,
  plantilla: { subject: string; html: string }
): Promise<void> {
  if (!apiKey) return;
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: plantilla.subject,
    html: plantilla.html,
  });
  if (error) throw new Error(error.message);
}

export async function agregarAAudiencia(
  email: string,
  firstName?: string
): Promise<void> {
  if (!apiKey || !audienceId) return;
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

export async function marcarBajaEnAudiencia(email: string): Promise<void> {
  if (!apiKey || !audienceId) return;
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.contacts.update({
    email,
    audienceId,
    unsubscribed: true,
  });
  if (error) throw new Error(error.message);
}
