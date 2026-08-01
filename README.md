# SeViveLa

Plataforma de descubrimiento de experiencias, entretenimiento, cultura, gastronomía, turismo y estilo de vida en Costa Rica.

> **Tesis:** Instagram y TikTok son el alcance; la web es el activo. Cada pieza de contenido es un mecanismo de captura de datos first-party segmentables y monetizables ante marcas.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript** estricto
- **Tailwind CSS v4** (tokens en `app/globals.css`)
- Fuentes self-hosted (Fontsource) vía `next/font/local`
- _Por integrar:_ Sanity CMS · Supabase (Postgres + Auth + Storage) · Upstash Redis · Resend · Cloudflare Turnstile/Stream · Mapbox

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completar variables
npm run dev                  # http://localhost:3000
```

Scripts: `npm run build` · `npm run lint` · `npm run typecheck`

## Presupuesto de performance (restricción, no meta)

LCP < 1.8s móvil · INP < 200ms · CLS < 0.1 · **JS inicial < 180KB gzip** · Lighthouse ≥ 90 en las 4 categorías. Cada decisión se evalúa contra esto.

## Estructura

```
app/            Rutas (App Router) + layout + globals.css (tokens)
app/fonts/      Fuentes variables self-hosted
components/     Primitivos de UI (header, bottom-nav, cards, íconos)
lib/            Configuración del sitio y datos de verticales
public/         Assets estáticos (logo.svg)
```

## Reglas no negociables

1. Mobile-first radical (~90% del tráfico llega del webview in-app de IG/TikTok).
2. Las APIs de redes sociales jamás se llaman en el request del usuario: solo cron → DB → render, con fallback a cache.
3. Cero embeds oficiales de IG/TikTok en páginas de alto tráfico.
4. Ningún dato personal se guarda sin consentimiento explícito registrado (texto exacto, versión, IP, user-agent, timestamp).
5. `SUPABASE_SERVICE_ROLE_KEY` nunca sale del servidor. Toda validación se repite en el servidor con Zod.

Ver el Master Brief v2.0 para la especificación completa.
