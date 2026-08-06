import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad (O1). La CSP arranca en Report-Only para observar
 * violaciones sin romper nada; cuando esté limpia, se cambia la clave a
 * "Content-Security-Policy" (enforce).
 */
const CSP = [
  "default-src 'self'",
  "frame-ancestors 'self'",
  // Next inyecta estilos/scripts inline; PostHog, Turnstile y Vercel Insights son los únicos terceros.
  "script-src 'self' 'unsafe-inline' https://*.posthog.com https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  // CloudFront = imágenes del contenido mock (fallback cuando Sanity no responde);
  // googleusercontent/githubusercontent = avatares del login del Studio.
  "img-src 'self' https://cdn.sanity.io https://d8j0ntlcm91z4.cloudfront.net https://lh3.googleusercontent.com https://avatars.githubusercontent.com data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.posthog.com https://*.sanity.io https://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
];

/**
 * Día de la migración a sevive.la: poner MIGRAR_DOMINIO=1 en Vercel y
 * redeployar — todo el tráfico de *.vercel.app salta 308 al dominio final.
 * Antes de eso, la variable no existe y no se emite ningún redirect.
 */
const redirectsDominio = async () =>
  process.env.MIGRAR_DOMINIO === "1"
    ? [
        {
          source: "/:path*",
          has: [{ type: "host" as const, value: "sevive-la.vercel.app" }],
          destination: "https://sevive.la/:path*",
          permanent: true,
        },
      ]
    : [];

const nextConfig: NextConfig = {
  redirects: redirectsDominio,
  // Garantiza que las fuentes/logo de la og:image viajen en el bundle serverless.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./app/og/*.ttf", "./public/logo.svg"],
    "/mi-cupon/[code]/imagen": ["./app/og/*.ttf", "./public/logo.svg"],
    "/agenda/[slug]/opengraph-image*": ["./app/og/*.ttf", "./public/logo.svg"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Proxy de PostHog: esquiva bloqueadores y mantiene connect-src en 'self'.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
