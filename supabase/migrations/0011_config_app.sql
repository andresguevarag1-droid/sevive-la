-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Configuración interna de la aplicación (clave/valor)
--
-- Primer uso: el token de Instagram. Los tokens de larga duración de la
-- API de Instagram vencen a los 60 días; el cron de reels lo renueva
-- solo y necesita dónde guardar el token renovado (las variables de
-- entorno de Vercel no se pueden escribir desde el código). Sin esta
-- tabla, el cron funciona igual pero el token vence a los 60 días y hay
-- que pegarlo de nuevo a mano.
--
-- Mismas reglas que el resto del esquema: RLS activo, sin acceso del
-- cliente anónimo; escribe solo el service role desde route handlers.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;
