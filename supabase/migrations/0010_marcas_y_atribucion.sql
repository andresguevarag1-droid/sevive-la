-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Leads de marcas (B2B) + atribución de personas
--
-- 1) brand_leads: el formulario "Para marcas" deja de ser un mailto y
--    guarda cada consulta comercial (marca, contacto, objetivo, formato
--    de interés). Es el pipeline de ventas del negocio.
-- 2) people.attribution: qué canal trajo a cada persona (UTM/referrer/
--    landing leídos al momento del alta) — el argumento de venta ante
--    marcas ("sé de dónde viene mi audiencia").
--
-- Mismas reglas que el resto del esquema: RLS activo, sin acceso del
-- cliente anónimo; escribe solo el service role desde route handlers.
-- Aplicar en el SQL Editor de Supabase o con `supabase db push`.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.brand_leads (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,              -- nombre de la marca / empresa
  contact_name text not null,            -- persona de contacto
  email text not null,
  phone text,                            -- opcional
  interest text,                         -- formato de interés: 'dinamica' | 'patrocinado' | 'cuponera' | 'boletin' | 'otro'
  message text,                          -- qué quiere lograr, en sus palabras
  utm jsonb,                             -- atribución de origen de la consulta
  -- Prueba de consentimiento (Ley 8968): el contacto también es una persona.
  consent_text text not null,            -- TEXTO EXACTO mostrado
  consent_version text not null,
  ip inet,
  user_agent text,
  status text not null default 'nuevo'   -- 'nuevo' | 'contactado' | 'cerrado'
    check (status in ('nuevo', 'contactado', 'cerrado')),
  created_at timestamptz not null default now()
);

create index if not exists idx_brand_leads_created
  on public.brand_leads (created_at desc);

alter table public.brand_leads enable row level security;
revoke all on public.brand_leads from anon, authenticated;

-- Atribución de origen de cada persona (se llena al captarla).
alter table public.people
  add column if not exists attribution jsonb;
