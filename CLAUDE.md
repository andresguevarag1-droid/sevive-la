# CLAUDE.md — SeViveLa

Contexto para asistentes de código que trabajen en este repo.

## Qué es

Plataforma web de descubrimiento (experiencias, entretenimiento, cultura, gastronomía, turismo, estilo de vida) para Costa Rica. **NO** es una web informativa: es una máquina de captura de datos first-party monetizables ante marcas. Modelo: 6 verticales × 5 tipos de contenido cruzados.

## Stack (confirmado)

Next.js **15** (App Router, pinneado — no subir a 16 sin acordar) · React 19 · TypeScript estricto · Tailwind v4 · fuentes self-hosted (Fontsource + `next/font/local`, no Google Fonts en build). Por integrar: Sanity (contenido), Supabase (personas/datos, RLS), Upstash Redis, Resend, Cloudflare Turnstile/Stream, Mapbox.

## Separación de responsabilidades (no romper)

- **Contenido editorial → Sanity.** Lo edita el cliente sin ayuda técnica, en español.
- **Datos de personas → Supabase**, con RLS y auditoría de consentimiento.
- Nunca se mezclan.

## Reglas duras

- Mobile-first radical: ~90% del tráfico es webview in-app de IG/TikTok. Bottom-nav, gestos, safe-area, `100dvh`.
- Presupuesto de performance: LCP < 1.8s, INP < 200ms, **JS inicial < 180KB gzip**, Lighthouse ≥ 90. Es restricción, no meta.
- APIs de redes sociales: solo cron → DB → render, con fallback a cache. Cero embeds oficiales en alto tráfico.
- Consentimiento explícito registrado (texto exacto, versión, IP, UA, timestamp). Checkbox nunca premarcado.
- `SUPABASE_SERVICE_ROLE_KEY` solo servidor. Toda validación repetida en servidor con Zod.
- Contenido patrocinado siempre etiquetado.

## Sistema de diseño

Tokens en `app/globals.css` (`@theme`). Dark-mode por defecto (`--color-canvas: #08080a`). Magenta `#ea2889` = CTA; morado/petróleo solo superficie/gradiente (fallan contraste como texto). Color por vertical en `lib/site.ts`. Comentarios en español; nombres de variables/funciones en inglés.

## Forma de trabajo

Antes de escribir código, confirmar el plan si implica decisiones de arquitectura. Código completo y funcional (no fragmentos). Cada componente con tipos y estados de carga/error/vacío. Al cerrar un módulo, checklist de QA.

## Estado actual

Setup + sistema de diseño base + home shell (hero, navegador de verticales, footer) + navegación (header inteligente, bottom-nav). Pendiente: rails de contenido, verticales con filtros, detalle, agenda, Sanity, y el backend de captura (dinámicas, panel, sync social).
