-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Esquema de captura de datos first-party (Supabase)
-- Ley 8968 (Costa Rica): consentimiento explícito, informado y auditable.
--
-- REGLAS:
--  · RLS activo en TODAS las tablas. El cliente anónimo NO tiene acceso
--    directo a datos de personas: toda escritura pasa por route handlers
--    del servidor (service role) validados con Zod.
--  · Este esquema NUNCA se mezcla con el contenido editorial (Sanity).
--
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.
-- ─────────────────────────────────────────────────────────────

-- Personas / suscriptores (perfil de audiencia)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  phone text,                            -- E.164, opcional
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text,                           -- 'boletin' | 'dinamica' | 'referido' ...
  status text not null default 'active'  -- 'active' | 'unsubscribed' | 'bounced'
    check (status in ('active', 'unsubscribed', 'bounced'))
);

-- Intereses declarados / inferidos (segmentación por vertical)
create table if not exists public.person_interests (
  person_id uuid not null references public.people(id) on delete cascade,
  vertical text not null,                -- slug de vertical
  weight int not null default 1,         -- declarado=3, inferido por comportamiento=1
  updated_at timestamptz not null default now(),
  primary key (person_id, vertical)
);

-- Auditoría de consentimiento (Ley 8968) — inmutable, append-only
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  purpose text not null,                 -- 'newsletter' | 'dinamica:<slug>' | 'marketing'
  consent_text text not null,            -- TEXTO EXACTO mostrado a la persona
  consent_version text not null,         -- versión del texto
  granted boolean not null,              -- true = aceptó
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Dinámicas / giveaways (metadatos + estado; el contenido editorial va en Sanity)
create table if not exists public.dynamics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  vertical text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft'   -- 'draft' | 'live' | 'closed'
    check (status in ('draft', 'live', 'closed')),
  created_at timestamptz not null default now()
);

-- Participaciones (lead cualificado por dinámica)
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  dynamic_id uuid not null references public.dynamics(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  answers jsonb,                         -- respuestas del formulario
  created_at timestamptz not null default now(),
  unique (dynamic_id, person_id)         -- una participación por persona
);

-- Eventos de comportamiento (para inferir intereses; ligero)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  person_id uuid references public.people(id) on delete set null,
  anon_id text,                          -- cookie anónima si no hay persona
  name text not null,                    -- 'view_vertical' | 'play_reel' | 'open_beneficio'...
  props jsonb,
  created_at timestamptz not null default now()
);

-- ── Índices de consulta frecuente ──
create index if not exists idx_consents_person on public.consents (person_id);
create index if not exists idx_entries_dynamic on public.entries (dynamic_id);
create index if not exists idx_events_name_created on public.events (name, created_at desc);
create index if not exists idx_people_status on public.people (status);

-- ── updated_at automático en people y person_interests ──
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_people_updated_at on public.people;
create trigger trg_people_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

drop trigger if exists trg_person_interests_updated_at on public.person_interests;
create trigger trg_person_interests_updated_at
  before update on public.person_interests
  for each row execute function public.set_updated_at();

-- ── RLS: activo en todo; sin políticas para anon = acceso denegado ──
-- (el service role del servidor bypassa RLS; el navegador con anon key
--  no puede leer ni escribir NINGUNA de estas tablas)
alter table public.people enable row level security;
alter table public.person_interests enable row level security;
alter table public.consents enable row level security;
alter table public.dynamics enable row level security;
alter table public.entries enable row level security;
alter table public.events enable row level security;

-- Defensa en profundidad: revocar grants por defecto a los roles del cliente.
revoke all on public.people from anon, authenticated;
revoke all on public.person_interests from anon, authenticated;
revoke all on public.consents from anon, authenticated;
revoke all on public.dynamics from anon, authenticated;
revoke all on public.entries from anon, authenticated;
revoke all on public.events from anon, authenticated;

-- ── Lectura pública agregada (sin PII): contador de participaciones ──
-- security definer: corre con permisos del dueño, expone SOLO el número.
create or replace function public.dynamic_entry_count(dynamic_slug text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.entries e
  join public.dynamics d on d.id = e.dynamic_id
  where d.slug = dynamic_slug;
$$;

grant execute on function public.dynamic_entry_count(text) to anon, authenticated;
