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

Ambos son idempotentes (tabla `email_log`): aunque corran dos veces, nadie
recibe un correo repetido. Sin `CRON_SECRET` o sin Resend responden "ok, 0
enviados" y no hacen nada.

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

- Migraciones pendientes de aplicar en Supabase (SQL Editor, en orden):
  `0008_agenda_respaldo.sql`, `0009_recordatorios.sql` y
  `0010_marcas_y_atribucion.sql` (leads del formulario "Para marcas" +
  columna de atribución de personas; sin ella el sitio funciona igual,
  solo avisa por logs y no guarda esos dos datos).
- `ADMIN_PANEL_KEY` en Vercel para el panel (`/admin/datos` y `/admin/locales`).
- `SENTRY_DSN` cuando abras la cuenta (el código ya está listo).
- Rotar/borrar el token de escritura de Sanity al terminar las siembras.
