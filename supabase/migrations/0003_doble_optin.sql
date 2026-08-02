-- ─────────────────────────────────────────────────────────────
-- SeViveLa · Doble opt-in del boletín
-- Permite el estado 'pending' en people: la persona queda pendiente hasta
-- confirmar su correo (link firmado). Aplicar DESPUÉS de 0001.
-- ─────────────────────────────────────────────────────────────

alter table public.people
  drop constraint if exists people_status_check;

alter table public.people
  add constraint people_status_check
  check (status in ('pending', 'active', 'unsubscribed', 'bounced'));
