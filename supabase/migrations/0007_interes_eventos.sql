-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Interés en eventos pasados ("avisame de la próxima")
--
-- Cuando un evento ya pasó, la página captura correos de personas que
-- quieren enterarse de la próxima edición. Cada fila es un lead
-- segmentado POR EVENTO: la audiencia que se le puede monetizar al
-- organizador de la siguiente edición.
--
-- Mismas reglas que el resto del esquema: RLS activo, sin acceso del
-- cliente anónimo; escribe solo el service role desde route handlers.
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.event_interest (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  event_slug text not null,              -- slug del evento en Sanity
  event_title text not null,             -- título al momento del registro
  vertical text not null,                -- slug de vertical (segmentación)
  utm jsonb,                             -- atribución de origen (first-touch)
  created_at timestamptz not null default now(),
  unique (person_id, event_slug)         -- un registro por persona y evento
);

create index if not exists idx_event_interest_slug
  on public.event_interest (event_slug, created_at desc);

alter table public.event_interest enable row level security;
revoke all on public.event_interest from anon, authenticated;
