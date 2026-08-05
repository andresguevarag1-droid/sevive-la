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
export const linkRecuperarAgenda = (email: string) =>
  linkFirmado("/mi-agenda/recuperar", email);

/* ── Plantillas (español, colores de marca, HTML simple que rinde en todo cliente) ── */

/** Sticker del logo: bloque negro con borde blanco, levemente inclinado.
 *  transform degrada con gracia en clientes viejos (queda recto). */
function sticker(texto: string, giro: number, bang = false): string {
  return `<span style="display:inline-block;background:#1a1526;border:3px solid #ffffff;border-radius:6px;color:#ffffff;font-weight:800;font-size:13px;letter-spacing:2px;padding:5px 9px;margin-right:4px;transform:rotate(${giro}deg);">${texto}${bang ? `<span style="color:#c71e70;">!</span>` : ""}</span>`;
}

/** Cabecera de marca: banda lila con los stickers del logo (SE VIVE LA!). */
function masthead(badge?: string): string {
  return `<div style="background:#a190d2;border-radius:14px 14px 0 0;padding:22px 28px;">
      ${sticker("SE", -3)}${sticker("VIVE", 2)}${sticker("LA", -2, true)}
      ${badge ? `<div style="margin-top:12px;"><span style="letter-spacing:2px;font-size:11px;font-weight:700;color:#1a1526;">${badge}</span></div>` : ""}
    </div>`;
}

function layoutHtml(
  cuerpo: string,
  email: string,
  opts?: { badge?: string; sinBaja?: boolean }
): string {
  const baja = opts?.sinBaja ? null : linkBaja(email);
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f2fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1526;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    ${masthead(opts?.badge)}
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

/** "Jueves 14 de agosto, 19:00" en hora CR (sin hora si viene falsa). */
function fmtFechaCorreo(iso: string, conHora = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(conHora ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false } : {}),
    timeZone: "America/Costa_Rica",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
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

export function plantillaPinLocal(
  local: { nombre: string; pin: string; beneficios: string[] }
): { subject: string; html: string } {
  const lista = local.beneficios.length
    ? `<p style="line-height:1.6;margin:14px 0 0;"><strong>Beneficios que podés canjear:</strong><br/>${local.beneficios.join("<br/>")}</p>`
    : "";
  return {
    subject: `Tu PIN de canje de cupones · ${local.nombre}`,
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Hola, equipo de ${local.nombre}.</h1>
      <p style="line-height:1.6;margin:0 0 6px;">Con este PIN pueden canjear los cupones de SeViveLa que los clientes presenten en caja. Guárdenlo bien: es la llave del canje.</p>
      <p style="background:#f6f2fb;border:1px dashed #a190d2;border-radius:12px;padding:16px;text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;margin:18px 0;">${local.pin}</p>
      <p style="line-height:1.7;margin:0;"><strong>Cómo se canjea (3 pasos):</strong><br/>
      1. El cliente muestra su cupón (QR o código).<br/>
      2. Escaneen el QR con la cámara del teléfono — abre ${site.url.replace("https://", "")}/canjear — o entren ahí y escriban el código.<br/>
      3. Ingresen este PIN (solo la primera vez en cada teléfono) y toquen “Canjear cupón”. Verde = válido. Cada cupón sirve una sola vez.</p>
      ${lista}
      <p style="font-size:13px;color:#666174;line-height:1.6;margin:18px 0 0;">Si el PIN se pierde o se filtra, avisen a SeViveLa y les enviamos uno nuevo (el anterior deja de servir al instante).</p>`,
      "",
      { badge: "PARA EL LOCAL", sinBaja: true }
    ),
  };
}

/* ── Recordatorio de plan guardado (Mi agenda): "mañana es tu plan" ── */

export function plantillaRecordatorioEvento(
  email: string,
  evento: { titulo: string; inicio: string; lugar?: string; slug: string }
): { subject: string; html: string } {
  const url = `${site.url}/agenda/${evento.slug}?utm_source=email&utm_medium=recordatorio&utm_campaign=mi_agenda`;
  return {
    subject: `Mañana es tu plan: ${evento.titulo} 🗓️`,
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Mañana es tu plan.</h1>
       <p style="line-height:1.6;margin:0 0 14px;">Lo guardaste en tu agenda de SeViveLa y ya casi llega:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5dff0;border-radius:12px;">
         <tr>
           <td style="padding:18px 20px;">
             <p style="margin:0;font-size:18px;font-weight:800;line-height:1.35;">${evento.titulo}</p>
             <p style="margin:6px 0 0;font-size:14px;color:#666174;line-height:1.6;">${fmtFechaCorreo(evento.inicio)}${evento.lugar ? ` · ${evento.lugar}` : ""}</p>
           </td>
         </tr>
       </table>
       ${btn(url, "Ver el evento")}
       <p style="font-size:13px;color:#666174;line-height:1.6;margin:0;">Entradas, ubicación y detalles en la página del evento. ¡Que se viva!</p>`,
      email,
      { badge: "TU AGENDA" }
    ),
  };
}

/* ── Recuperación de "Mi agenda" en otro dispositivo (link mágico) ── */

export function plantillaRecuperarAgenda(
  email: string,
  cuantos: number
): { subject: string; html: string } | null {
  const link = linkRecuperarAgenda(email);
  if (!link) return null;
  return {
    subject: "Recuperá tu agenda de SeViveLa",
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 12px;">Tu agenda te está esperando.</h1>
       <p style="line-height:1.6;margin:0 0 6px;">Tenés <strong>${cuantos} ${cuantos === 1 ? "plan guardado" : "planes guardados"}</strong> respaldados con este correo. Tocá el botón desde el teléfono donde querés tenerlos:</p>
       ${btn(link, "Recuperar mi agenda")}
       <p style="font-size:13px;color:#666174;line-height:1.6;margin:0;">El enlace es personal — no lo compartás. Si no pediste esto, ignorá este correo: tu agenda no cambia.</p>`,
      email,
      { badge: "TU AGENDA" }
    ),
  };
}

/* ── Boletín semanal: los planes de la semana, curados ── */

export type BoletinContenido = {
  eventos: { titulo: string; inicio: string; lugar?: string; slug: string }[];
  cronicas: { titulo: string; slug: string }[];
  beneficio?: { titulo: string; marca: string; slug: string };
};

export function plantillaBoletinSemanal(
  email: string,
  c: BoletinContenido
): { subject: string; html: string } {
  const utm = "utm_source=email&utm_medium=boletin&utm_campaign=semanal";
  const filasEventos = c.eventos
    .map(
      (e) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee9f5;">
          <a href="${site.url}/agenda/${e.slug}?${utm}" style="color:#1a1526;text-decoration:none;">
            <span style="font-size:16px;font-weight:800;line-height:1.35;">${e.titulo}</span><br/>
            <span style="font-size:13px;color:#666174;">${fmtFechaCorreo(e.inicio)}${e.lugar ? ` · ${e.lugar}` : ""}</span>
          </a>
        </td>
      </tr>`
    )
    .join("");
  const filasCronicas = c.cronicas
    .map(
      (x) => `<p style="margin:0 0 10px;line-height:1.5;">
        <a href="${site.url}/cronica/${x.slug}?${utm}" style="color:#1a1526;font-weight:700;">${x.titulo} →</a>
      </p>`
    )
    .join("");
  return {
    subject: "Los planes de esta semana 🗓️",
    html: layoutHtml(
      `<h1 style="font-size:22px;margin:0 0 4px;">Esta semana se vive así.</h1>
       <p style="line-height:1.6;color:#666174;margin:0 0 10px;">Lo que vale la pena, curado por la redacción. Sin relleno.</p>
       ${
         c.eventos.length
           ? `<p style="letter-spacing:2px;font-size:11px;font-weight:700;color:#a190d2;margin:18px 0 4px;">LA AGENDA</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${filasEventos}</table>`
           : ""
       }
       ${
         c.cronicas.length
           ? `<p style="letter-spacing:2px;font-size:11px;font-weight:700;color:#a190d2;margin:22px 0 10px;">PARA LEER</p>${filasCronicas}`
           : ""
       }
       ${
         c.beneficio
           ? `<p style="letter-spacing:2px;font-size:11px;font-weight:700;color:#a190d2;margin:22px 0 8px;">EL BENEFICIO</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px dashed #a190d2;border-radius:12px;background:#f6f2fb;">
                <tr><td style="padding:16px 18px;">
                  <span style="font-size:16px;font-weight:800;">${c.beneficio.titulo}</span><br/>
                  <span style="font-size:13px;color:#666174;">${c.beneficio.marca}</span><br/>
                  <a href="${site.url}/promociones/${c.beneficio.slug}?${utm}" style="color:#c71e70;font-weight:700;font-size:14px;">Reclamar →</a>
                </td></tr>
              </table>`
           : ""
       }
       ${btn(`${site.url}/agenda?${utm}`, "Ver la agenda completa")}`,
      email,
      { badge: "EL BOLETÍN · CADA JUEVES" }
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
