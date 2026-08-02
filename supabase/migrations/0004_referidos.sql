-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Referidos en dinámicas (Feature A)
-- Cada participante recibe un referral_code único; las entradas que llegan
-- con ?ref=<code> guardan referred_by. Las chances del sorteo = 1 base +
-- referidos válidos (con tope). Aplicar DESPUÉS de 0002_campanas.sql.
-- ─────────────────────────────────────────────────────────────

alter table public.campaign_entries
  add column if not exists referral_code text unique,            -- código propio del participante
  add column if not exists referred_by   text,                   -- código por el que llegó (nullable)
  add column if not exists referral_valid boolean not null default true; -- invalidar fraude sin borrar el lead

create index if not exists idx_entries_referred_by
  on public.campaign_entries (campaign_slug, referred_by);

-- Chances por participante: 1 base + referidos válidos (tope 10 por defecto;
-- el endpoint aplica el tope configurado por campaña desde Sanity).
create or replace view public.entry_chances as
select
  e.id,
  e.campaign_slug,
  e.email,
  e.referral_code,
  1 + least(
    coalesce((
      select count(*) from public.campaign_entries r
      where r.campaign_slug = e.campaign_slug
        and r.referred_by = e.referral_code
        and r.referral_valid = true
        and r.email <> e.email               -- no auto-referido
    ), 0),
    10                                        -- TOPE de chances bonus
  ) as chances
from public.campaign_entries e;

-- La vista contiene correos: solo el servidor la lee.
revoke all on public.entry_chances from anon, authenticated;

-- ── Sorteo ponderado (correr manualmente al cerrar; documentado en las bases) ──
-- Expande cada entrada por sus chances y elige una fila al azar con una semilla
-- registrable para auditoría:
--   select setseed(0.42);  -- ⚠️ registrar la semilla usada en el acta del sorteo
--   select e.email, e.referral_code
--   from public.entry_chances e, generate_series(1, e.chances)
--   where e.campaign_slug = 'latin-grammys'
--   order by random()
--   limit 1;
