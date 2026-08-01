/**
 * Rate-limit por IP con Upstash Redis (ventana deslizante).
 * Si Upstash no está configurado, permite el request (degradación graceful:
 * Turnstile + honeypot siguen activos).
 */
import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/** 10 requests por 10 minutos por IP y formulario — generoso para humanos. */
let limiter: Ratelimit | null = null;
if (url && token) {
  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "10 m"),
    prefix: "sevivela:rl",
  });
}

export async function checkRateLimit(
  form: string,
  ip: string | null
): Promise<{ allowed: boolean }> {
  if (!limiter) return { allowed: true };
  try {
    const { success } = await limiter.limit(`${form}:${ip ?? "sin-ip"}`);
    return { allowed: success };
  } catch (err) {
    // Si Redis falla, no bloquear el formulario.
    console.error("[rate-limit] fallo consultando Upstash:", err);
    return { allowed: true };
  }
}
