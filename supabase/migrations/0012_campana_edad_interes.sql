-- Campañas que piden edad exacta (en vez de preguntas sí/no de elegibilidad)
-- y/o una pregunta de interés opcional (ej. "tema favorito del evento").
-- Ambas columnas son opcionales: las campañas existentes (Grammy) no las usan.
alter table campaign_entries
  add column if not exists edad integer,
  add column if not exists interes_respuesta text;

comment on column campaign_entries.edad is
  'Edad declarada por la persona, solo en campañas con pideEdad activo en Sanity.';
comment on column campaign_entries.interes_respuesta is
  'Respuesta a la pregunta de interés opcional de la campaña (preguntaInteres en Sanity), si la contestó.';
