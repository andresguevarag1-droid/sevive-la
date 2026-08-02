-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Alcance de canje por local
-- Un local solo puede canjear cupones de SUS beneficios. NULL = puede
-- canjear cualquiera (útil para un local "casa matriz" de SeViveLa).
-- Aplicar DESPUÉS de 0005_cupones.sql.
-- ─────────────────────────────────────────────────────────────

alter table public.venues
  add column if not exists benefit_slugs text[];  -- null = todos

-- Ejemplo de alta con alcance:
--   insert into public.venues (slug, name, token_hash, benefit_slugs)
--   values ('la-ventana-escalante', 'La Ventana — Escalante',
--           encode(digest('EL-TOKEN-DEL-LOCAL', 'sha256'), 'hex'),
--           array['brunch-la-ventana'])
--   on conflict (slug) do update
--     set token_hash = excluded.token_hash,
--         benefit_slugs = excluded.benefit_slugs;
