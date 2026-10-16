/**
 * Meta Conversions API (server-side) — evento "Lead" de campañas.
 *
 * Por qué server-side y no un pixel en el cliente: el sitio promete "sin
 * rastreo publicitario de terceros" en el cliente. El CAPI manda el evento
 * de servidor a servidor con los identificadores HASHEADOS (SHA-256), sin
 * inyectar scripts de terceros en el navegador de la persona.
 *
 * Duerme sin `META_PIXEL_ID` / `META_CAPI_TOKEN` (igual que el resto de
 * integraciones del repo). Además, el llamador SOLO debe invocarlo cuando la
 * persona dio su autorización de marketing (opt-in explícito), y la copia de
 * consentimiento/privacidad debe declarar la medición con Meta (Ley 8968).
 */
import "server-only";
import { createHash } from "node:crypto";

const PIXEL_ID = process.env.META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
/** Código de prueba del Events Manager (opcional, para "Probar eventos"). */
const TEST_CODE = process.env.META_CAPI_TEST_CODE;
const API_VERSION = "v21.0";

export const metaCapiConfigured = Boolean(PIXEL_ID && TOKEN);

/** SHA-256 en hex de un valor normalizado (requisito de Meta). */
function hash(valor: string): string {
  return createHash("sha256").update(valor).digest("hex");
}

/** Normaliza teléfono a dígitos E.164 sin "+". CR: 8 dígitos → 506XXXXXXXX. */
function normalizarTelefono(tel: string): string | null {
  const digitos = tel.replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length === 8) return `506${digitos}`;
  return digitos;
}

type LeadInput = {
  email: string;
  phone?: string | null;
  firstName?: string | null;
  /** Provincia/ciudad declarada (se hashea como `ct`). */
  ciudad?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** _fbc / _fbp si existieran (hoy no hay pixel en cliente, suelen ir vacíos). */
  fbc?: string | null;
  fbp?: string | null;
  /** ID para deduplicar con un eventual evento de navegador. */
  eventId: string;
  /** URL de la landing donde ocurrió el lead. */
  eventSourceUrl: string;
};

/**
 * Envía un evento "Lead" al CAPI. Fire-and-forget: nunca lanza; el registro
 * del lead en Supabase es la fuente de verdad y no depende de esto.
 */
export async function enviarLeadCapi(input: LeadInput): Promise<void> {
  if (!metaCapiConfigured) return;

  const userData: Record<string, unknown> = {
    em: [hash(input.email.trim().toLowerCase())],
  };
  const tel = input.phone ? normalizarTelefono(input.phone) : null;
  if (tel) userData.ph = [hash(tel)];
  if (input.firstName) userData.fn = [hash(input.firstName.trim().toLowerCase())];
  if (input.ciudad) userData.ct = [hash(input.ciudad.trim().toLowerCase().replace(/\s+/g, ""))];
  if (input.ip) userData.client_ip_address = input.ip;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.fbp) userData.fbp = input.fbp;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        user_data: userData,
      },
    ],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[meta-capi] Lead rechazado:", res.status, txt.slice(0, 300));
    }
  } catch (err) {
    console.error("[meta-capi] Lead falló (no fatal):", err);
  }
}
