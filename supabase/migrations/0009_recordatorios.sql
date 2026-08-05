-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Registro de envíos automáticos (recordatorios y boletín)
--
-- Cada fila es un envío ya hecho: el cron la usa como "claim" idempotente
-- para NUNCA mandar el mismo correo dos veces (recordatorio de un plan
-- guardado, edición del boletín semanal, etc.).
--
-- Mismas reglas: RLS activo, sin acceso del cliente anónimo.
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  -- 'recordatorio:<slug-evento>' | 'boletin:<YYYY-MM-DD>' ...
  clave text not null,
  sent_at timestamptz not null default now(),
  unique (person_id, clave)
);

create index if not exists idx_email_log_clave on public.email_log (clave);

alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
