/**
 * Verificación server-side de Cloudflare Turnstile (anti-bot).
 * Si TURNSTILE_SECRET_KEY no está configurada, la verificación se omite
 * (degradación graceful mientras se integra el servicio).
 */
import "server-only";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

/**
 * true = el request puede continuar (verificado, o Turnstile deshabilitado).
 * false = token ausente/ inválido con Turnstile habilitado.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // no configurado aún: no bloquear
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    // Si Cloudflare no responde, no castigar a la persona: dejar pasar
    // (el rate-limit y el honeypot siguen protegiendo).
    console.error("[turnstile] verificación falló:", err);
    return true;
  }
}
