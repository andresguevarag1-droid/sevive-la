/**
 * Rastreo de errores del SERVIDOR (O3): captura fallos de route handlers y
 * render — sobre todo los POST de participación y cupones, donde un error
 * silencioso es un lead perdido. Solo se activa con SENTRY_DSN configurado y
 * NO carga nada en el cliente (presupuesto de JS intacto).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0, // solo errores; nada de tracing (costo y ruido)
      enableLogs: false,
    });
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(...args);
  }
}
