-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Campañas (dinámicas de alto volumen, ej. Latin Grammys)
-- Leads con banderas de elegibilidad + UTMs. 1 participación por correo
-- por campaña. El consentimiento se audita en public.consents (0001),
-- ligado a la persona. RLS activo; escritura SOLO vía servidor.
--
-- Aplicar DESPUÉS de 0001_captura_de_datos.sql.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.campaign_entries (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text not null,                 -- 'latin-grammys'
  person_id uuid references public.people(id) on delete set null,
  email text not null,
  full_name text not null,
  residence text not null,                     -- provincia
  phone text,
  is_over_21 boolean not null,
  has_passport boolean not null,
  has_us_visa boolean not null,
  eligible boolean generated always as (is_over_21 and has_passport and has_us_visa) stored,
  follows_ig boolean not null default false,   -- autodeclarado, no verificable
  utm jsonb,                                   -- {source, medium, content, campaign}
  created_at timestamptz not null default now(),
  unique (campaign_slug, email)                -- 1 participación por correo por campaña
);

create index if not exists idx_campaign_entries_slug on public.campaign_entries (campaign_slug, created_at desc);
create index if not exists idx_campaign_entries_eligible on public.campaign_entries (campaign_slug, eligible);

alter table public.campaign_entries enable row level security;
revoke all on public.campaign_entries from anon, authenticated;

-- Lectura pública agregada (sin PII): contador de participaciones de campaña.
create or replace function public.campaign_entry_count(slug text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.campaign_entries where campaign_slug = slug;
$$;

grant execute on function public.campaign_entry_count(text) to anon, authenticated;
