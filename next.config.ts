import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad (O1). La CSP arranca en Report-Only para observar
 * violaciones sin romper nada; cuando esté limpia, se cambia la clave a
 * "Content-Security-Policy" (enforce).
 */
const CSP = [
  "default-src 'self'",
  // Next inyecta estilos/scripts inline; Turnstile y Vercel Insights son los únicos terceros.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://cdn.sanity.io data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.sanity.io https://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com",
  "frame-src https://challenges.cloudflare.com",
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
  { key: "Content-Security-Policy-Report-Only", value: CSP },
];

const nextConfig: NextConfig = {
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
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
};

export default nextConfig;
