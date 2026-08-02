-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Cupones con redención medible (Feature B)
-- Emisión de cupones únicos por beneficio (código + QR), canje de un solo
-- uso protegido por token de local, y métricas agregadas para marcas.
-- Aplicar DESPUÉS de 0001. RLS activo: TODO pasa por el servidor.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- Locales autorizados a canjear (el token viaja hasheado, nunca en claro).
create table if not exists public.venues (
  slug text primary key,                  -- 'la-ventana-escalante'
  name text not null,
  token_hash text not null,               -- sha256 hex del token del local
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  benefit_slug text not null,             -- coincide con el slug del beneficio en Sanity
  email text not null,
  person_id uuid references public.people(id) on delete set null,
  code text unique not null,              -- legible: SV-XXXX-XXXX
  status text not null default 'issued'
    check (status in ('issued', 'redeemed', 'expired', 'void')),
  source jsonb,                           -- utm / campaña / vertical de origen (atribución)
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz,
  redeemed_at timestamptz,
  redeemed_by text references public.venues(slug),
  unique (benefit_slug, email)            -- un cupón por persona por beneficio
);

create index if not exists idx_coupons_status on public.coupons (benefit_slug, status);

alter table public.venues enable row level security;
alter table public.coupons enable row level security;
revoke all on public.venues from anon, authenticated;
revoke all on public.coupons from anon, authenticated;

-- Métricas agregadas (SIN PII) para el futuro panel de marcas.
create or replace view public.coupon_stats as
select
  benefit_slug,
  count(*)                                             as emitidos,
  count(*) filter (where status = 'redeemed')          as canjeados,
  round(100.0 * count(*) filter (where status = 'redeemed') / nullif(count(*), 0), 1) as tasa_redencion,
  avg(redeemed_at - issued_at) filter (where status = 'redeemed') as tiempo_promedio_a_canje
from public.coupons
group by benefit_slug;

revoke all on public.coupon_stats from anon, authenticated;

-- ── Alta de un local (correrlo por cada marca/local que canjea) ──
-- 1) Inventar un token largo y dárselo SOLO al local (ej. generado con un
--    gestor de contraseñas). 2) Guardar únicamente su hash:
--   insert into public.venues (slug, name, token_hash)
--   values ('la-ventana-escalante', 'La Ventana — Escalante',
--           encode(digest('EL-TOKEN-DEL-LOCAL', 'sha256'), 'hex'))
--   on conflict (slug) do update set token_hash = excluded.token_hash;
