# SeViveLa — Runbook de operación

Guía corta para operar el sitio. Todo lo de correo está **construido y
dormido**: despierta solo al configurar Resend (sin tocar código).

## ✉️ Activar Resend (cuando tengás el dominio) — 10 min

1. En [resend.com](https://resend.com) → **Domains → Add domain** → `sevive.la`
   (o el que uses) y agregá los registros DNS que te indica. Esperá el ✓ verde.
2. En **API Keys** creá una clave.
3. En **Vercel → Settings → Environment Variables** agregá:
   - `RESEND_API_KEY` = la clave
   - `RESEND_FROM` = `SeViveLa <boletin@sevive.la>`
   - `EMAIL_LINK_SECRET` = valor aleatorio largo (`openssl rand -hex 32`)
   - `CRON_SECRET` = otro valor aleatorio largo (activa los crons)
   - (opcional) `RESEND_AUDIENCE_ID` si usás Audiences de Resend
4. **Redeploy**. Con eso se enciende TODO a la vez:
   - Doble opt-in y bienvenida del boletín
   - Confirmación de participación en dinámicas · cupones por correo · PIN de locales
   - **Recordatorios "mañana es tu plan"** (cron diario 8:00 CR)
   - **Boletín semanal automático** (cron jueves 8:00 CR, se arma solo desde Sanity)
   - **Recuperación de "Mi agenda"** por link mágico
5. Probá: suscribite al boletín con tu correo → debe llegar la confirmación.

Los correos ya vienen diseñados con la identidad (stickers del logo, lila,
CTA magenta) — no hay que diseñar nada.

## ⏰ Crons (ya declarados en `vercel.json`)

| Cron | Cuándo | Qué hace |
|---|---|---|
| `/api/cron/recordatorios` | Diario 14:00 UTC (8:00 CR) | "Mañana es tu plan" a agendas respaldadas |
| `/api/cron/boletin` | Jueves 14:00 UTC (8:00 CR) | Boletín semanal a suscriptores activos |
| `/api/cron/notas-diarias` | Diario 12:40 UTC (6:40 CR) | Redactor de planta: nota de ANUNCIO por cada evento nuevo de la agenda (máx. 2/día) + roundups "La semana en planes" (lunes) y "Los planes del finde" (jueves) — completos, sin marcadores |
| `/api/cron/articulos` | Diario 13:00 UTC (7:00 CR) | Redacta con IA 2 borradores por evento, cerca de su fecha: Guía (faltan ≤10 días) y Cobertura (terminó hace 12h–4 días) → Studio |
| `/api/admin/revisar-articulos` | Diario 13:15 UTC (7:15 CR) | Corrige con IA el estilo de los borradores del robot y PUBLICA los completos; los esqueletos con `[COMPLETAR: …]` quedan corregidos en borrador para el equipo |
| `/api/cron/reels` | Diario 15:00 UTC (9:00 CR) | Trae los reels nuevos de @sevive.la a la videoteca (con miniatura propia) |
| `/api/cron/ig-eventos` | Diario 16:00 UTC (10:00 CR) | Lee los posts nuevos de @sevive.la: si anuncian un evento, lo crea en la agenda (con el arte del post) y el cron de artículos le escribe su guía |
| `/api/cron/destacadas` | Lunes 13:30 UTC (7:30 CR) | Renueva el "Destacado" del home con las 3 crónicas más leídas de la semana (datos de PostHog; si falta lectoría, completa con lo más reciente). Necesita `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` en Vercel: [us.posthog.com](https://us.posthog.com) → Settings → *Personal API keys* (crear una con permiso de lectura de Query) y el *Project ID* está en Settings → Project |

Todos son idempotentes: aunque corran dos veces, nadie recibe un correo
repetido (tabla `email_log`) ni se duplica un artículo o reel (_id
determinístico en Sanity). Sin sus variables de entorno responden
"dormido" y no hacen nada.

## 🤖 Activar las automatizaciones de contenido — 3 variables

Las dos automatizaciones nuevas duermen hasta que estén sus llaves en
Vercel (Settings → Environment Variables → Production, y **redeploy**):

1. **`SANITY_API_WRITE_TOKEN`** (la necesitan ambas) — 2 min:
   [sanity.io/manage](https://sanity.io/manage) → proyecto SeViveLa → API →
   Tokens → *Add API token* → nombre "robot-vercel", permisos **Editor** →
   copiá el token (se muestra una sola vez).
2. **`ANTHROPIC_API_KEY`** (artículos con IA) — 5 min:
   [console.anthropic.com](https://console.anthropic.com) → crear cuenta →
   API Keys → *Create key*. Cargá un saldo chico (USD 5 rinde meses: cada
   artículo cuesta centavos). Los artículos nacen como **borrador** en el
   Studio — bandeja de Crónicas — para revisar y publicar con un clic.
3. **`IG_ACCESS_TOKEN`** (reels) — 15 min, una vez:
   1. Convertí @sevive.la en cuenta **profesional** (Business o Creator)
      desde la app de Instagram, si no lo es ya.
   2. En [developers.facebook.com](https://developers.facebook.com) →
      *My Apps* → *Create App* → caso de uso **Instagram** → tipo Business.
   3. En el panel de la app → Instagram → **API setup with Instagram login**
      → agregá @sevive.la como cuenta → *Generate token* (iniciá sesión con
      la cuenta) → copiá el **token de larga duración**.
   4. Pegalo en Vercel como `IG_ACCESS_TOKEN`.
   El cron lo **renueva solo** cada día y guarda el renovado en Supabase
   (tabla `app_config`, migración 0011) — no hay que volver a tocarlo. Si
   alguna vez responde "token vencido", repetí el paso 3.

Prueba manual de cualquier cron (sin esperar a la hora):
`curl -H "Authorization: Bearer TU_CRON_SECRET" https://sevive-la.vercel.app/api/cron/reels`

**Revisor editorial** — corre solo cada día a las 7:15 CR (ver crons),
pero el mismo curl sirve para adelantarlo o vaciar una cola grande:
`curl -H "Authorization: Bearer TU_CRON_SECRET" https://sevive-la.vercel.app/api/admin/revisar-articulos`
Corrige con IA el estilo de cada borrador del robot (ortografía, voseo,
muletillas) y **publica** los que quedaron completos; los esqueletos de
cobertura con `[COMPLETAR: …]` se corrigen pero siguen en borrador para
que el equipo agregue lo vivencial. Revisa 4 por corrida. Lo escrito a
mano por el equipo nunca se toca.

## 🔴 Transmitir en vivo desde OBS — gratis, vía YouTube oculto

El sitio ya tiene todo: página **/en-vivo** (siempre visible, en reposo),
banda "🔴 EN VIVO" en el home cuando hay transmisión y captura de correos
("avisame cuando empiece"). El video viaja por YouTube en modo **no
listado**: no aparece en YouTube, solo dentro del sitio. Costo: $0.

**Una sola vez (preparar el canal):**
1. Canal de YouTube de SeViveLa → [youtube.com](https://youtube.com) →
   avatar → *Crear canal*.
2. En [studio.youtube.com](https://studio.youtube.com) → Crear →
   **Emitir en directo**. La primera vez pide verificar el teléfono y
   espera **24 horas** de habilitación (por eso se hace HOY, no el día
   del evento).
3. En OBS: Ajustes → Emisión → Servicio **YouTube - RTMPS** → *Conectar
   cuenta* (o pegar la clave de emisión de YouTube Studio).

**Cada transmisión (5 min):**
1. En YouTube Studio → Emitir en directo → creá la emisión con
   visibilidad **No listado** (clave: así NO aparece en YouTube).
2. Copiá el enlace del video (botón Compartir).
3. En el **Studio del sitio** → **🔴 En vivo (transmisiones)** → creá el
   documento: título, pegá el enlace, y encendé **EN VIVO** → Publish.
   En segundos aparece la banda en el home y el video en /en-vivo.
4. En OBS: *Iniciar transmisión*. A transmitir.
5. Al terminar: apagá el interruptor en el Studio (→ Publish) y detené
   OBS. La página vuelve a reposo y sigue capturando correos.

💡 Si anunciás la transmisión con días de anticipación, poné la fecha en
"Programada para": /en-vivo la muestra y junta correos desde ya (interés
"en-vivo" en la segmentación).

⚠️ Derechos: para shows/conciertos de terceros, transmitir el espectáculo
completo requiere permiso del organizador. Coberturas propias, entrevistas
y detrás de cámaras: sin problema.

## 🩺 Uptime (O4) — 5 min, una vez

El endpoint **`/api/health`** verifica Sanity + Supabase y responde 200 (sano)
o 503 (falla). Montá el monitor gratis:

1. Creá cuenta en [uptimerobot.com](https://uptimerobot.com) (plan gratis).
2. **Add monitor** → tipo HTTP(s) → URL: `https://sevive-la.vercel.app/api/health`
   (cambiala al migrar de dominio) → intervalo 5 min → alerta a tu correo.

## 💾 Respaldos de datos (O5)

- **Automático (recomendado):** en Supabase → Database → Backups, verificá que
  los backups diarios estén activos (vienen incluidos en el plan).
- **Manual (extra, local):** `npm run backup` en tu Mac vuelca todas las tablas
  a `backups/<fecha>/*.json`. Corrélo antes de cambios grandes y guardá la
  carpeta en Drive o disco externo. Nunca se sube al repo.

## 🌐 Migración a sevive.la (O7) — checklist para el día del cambio

1. Vercel → Settings → Domains → agregar `sevive.la` (y `www`).
2. Vercel → Environment Variables (Production): `NEXT_PUBLIC_SITE_URL=https://sevive.la`
   — la URL del sitio sale de esta variable; sin ella, canonicals, sitemap,
   QR de cupones y links de correo siguen apuntando a `sevive-la.vercel.app`.
3. Agregar también `MIGRAR_DOMINIO=1` — activa el redirect 308 de
   `sevive-la.vercel.app` hacia `sevive.la` (evita contenido duplicado).
4. **Redeploy forzado** (Deployments → ⋯ → Redeploy): agregar el dominio NO
   redeploya solo, y la metadata queda congelada en el dominio viejo.
5. Resend: verificar el dominio si no se hizo antes (arriba).
6. Google Search Console: agregar la propiedad nueva y **reenviar** `sitemap.xml`.
7. Actualizar el monitor de uptime a la URL nueva.
8. Los links de IG/TikTok: actualizarlos al dominio nuevo.

## 🔑 Recordatorios de seguridad

- Migración pendiente de aplicar en Supabase (SQL Editor):
  `0011_config_app.sql` (guarda el token renovado de Instagram; sin ella
  el cron de reels funciona igual, pero el token vence a los 60 días y
  hay que pegarlo de nuevo a mano). Las 0001–0010 ya están aplicadas.
- `ADMIN_PANEL_KEY` en Vercel para el panel (`/admin/datos` y `/admin/locales`).
- `SENTRY_DSN` cuando abras la cuenta (el código ya está listo).
- Rotar/borrar el token de escritura de Sanity al terminar las siembras.
