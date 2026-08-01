# CLAUDE.md — SeViveLa

Contexto para asistentes de código que trabajen en este repo. La fuente de
verdad extendida es el **Documento Maestro** del proyecto (especificación +
roadmap); este archivo es el resumen operativo.

## Qué es

Plataforma web de descubrimiento (experiencias, entretenimiento, cultura, gastronomía, turismo, estilo de vida) para Costa Rica. **NO** es una web informativa: es una máquina de captura de datos first-party monetizables ante marcas. Modelo: 6 verticales × tipos de contenido cruzados. El negocio son las dinámicas/giveaways, el boletín y las audiencias segmentadas.

## Stack (confirmado)

Next.js **15** (App Router, pinneado — no subir a 16 sin acordar) · React 19 · TypeScript estricto · Tailwind v4 · fuentes self-hosted (`next/font/local`, no Google Fonts en build) · Zod v4 · Sanity (contenido, Studio en `/studio`) · Supabase (personas/datos, RLS) · Resend · Upstash Redis · Cloudflare Turnstile. Futuro: Cloudflare Stream, Mapbox.

## Separación de responsabilidades (no romper)

- **Contenido editorial → Sanity.** Lo edita el cliente sin ayuda técnica, en español. Esquemas en `sanity/schemaTypes/`.
- **Datos de personas → Supabase**, con RLS y auditoría de consentimiento (`supabase/migrations/`). Escritura SOLO vía route handlers del servidor.
- Nunca se mezclan.

## Reglas duras

- Mobile-first radical: ~90% del tráfico es webview in-app de IG/TikTok. Bottom-nav, gestos, safe-area, `100dvh`.
- Presupuesto de performance: LCP < 1.8s, INP < 200ms, **JS inicial < 180KB gzip** en rutas públicas, Lighthouse ≥ 90. Es restricción, no meta. (`/studio` es la única excepción, aislado en su ruta.)
- APIs de redes sociales: solo cron → DB → render, con fallback a cache. Cero embeds oficiales en alto tráfico.
- Consentimiento explícito registrado (texto exacto en `lib/consent.ts`, versión, IP, UA, timestamp). Checkbox nunca premarcado (Ley 8968). Si cambia el texto, subir la versión.
- `SUPABASE_SERVICE_ROLE_KEY` solo servidor (nunca `NEXT_PUBLIC_`). Toda validación repetida en servidor con Zod (`lib/validation/`).
- Contenido patrocinado siempre etiquetado. Dinámicas SIEMPRE gratuitas (cobrar sería rifa ilegal) y con bases en `/legal/bases/[slug]`.
- Infraestructura separada de VISIA (Vercel/GitHub/Sanity/Supabase propios).

## Sistema de diseño

**Tema claro editorial** (print/Swiss + blend moderno, pasada "anti-IA"). Tokens en `app/globals.css` (`@theme`): papel `#f6f2fb`, **lila de marca `#a190d2`** protagonista (masthead, bandas), tinta `#1a1526`. **Magenta `#c71e70` = solo CTA/acción.** Lila/morados/petróleo = superficie e identidad de vertical, no texto sobre claro (contraste). Color por vertical en `lib/site.ts` + `globals.css`. Serif Fraunces para grandes titulares; sans Inter para cuerpo y tarjetas. Nada de degradados decorativos, orbes, glow ni fade-ins uniformes. Comentarios en español; nombres de variables/funciones en inglés.

## Forma de trabajo

Antes de escribir código, confirmar el plan si implica decisiones de arquitectura. Código completo y funcional (no fragmentos). Cada componente con tipos y estados de carga/error/vacío (los fetch de Sanity caen a mock: nada revienta el render). Al cerrar un módulo, checklist de QA (build limpio, presupuesto JS, a11y AA, estados, consentimiento, secrets fuera del repo).

## Estado actual (post-MVP de código)

Hecho: home shell + navegación · CMS Sanity completo (7 esquemas incl. `dinamica`, Studio en español, queries con fallback) · páginas de vertical `/[vertical]` · agenda con filtros hoy/finde · videoteca · promociones · búsqueda · comunidad/marcas/nosotros · **boletín funcional** (`/api/subscribe`) · **dinámicas end-to-end** (`/dinamicas/[slug]` + `/api/dinamica`) · legales (privacidad, términos, cookies, bases) · SQL de Supabase con RLS (`supabase/migrations/`) · rate-limit Upstash + Turnstile (degradan si faltan env) · SEO (sitemap/robots/manifest/OG) · webhook `/api/revalidate` · siembra `npm run seed`.

Pendiente (dueño): aplicar la migración SQL en Supabase, configurar env vars en Vercel (ver `.env.example`), CORS de Sanity, correr la siembra, webhook en sanity.io/manage. Pendiente (V1.1): detalle `[vertical]/[slug]` con Portable Text, sync social cron→DB→render, analítica de primera parte (`/api/events`).
