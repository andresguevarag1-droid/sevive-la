-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Respaldo de "Mi agenda" (eventos guardados por persona)
--
-- La agenda vive en el teléfono (localStorage); con el respaldo por
-- correo cada guardado queda ligado a una persona identificada: interés
-- declarado, evento por evento — segmentación de primera para marcas.
--
-- Mismas reglas del esquema: RLS activo, sin acceso del cliente anónimo;
-- escribe solo el service role desde route handlers.
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  event_slug text not null,              -- slug del evento en Sanity
  event_title text not null,             -- título al momento del respaldo
  inicio timestamptz,                    -- cuándo es el evento
  lugar text,
  vertical text not null,                -- slug de vertical (segmentación)
  created_at timestamptz not null default now(),
  unique (person_id, event_slug)         -- un guardado por persona y evento
);

create index if not exists idx_saved_events_slug
  on public.saved_events (event_slug, created_at desc);

alter table public.saved_events enable row level security;
revoke all on public.saved_events from anon, authenticated;
