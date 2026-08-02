import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Evento / Agenda (equipo de ediciones y redes).
 * Alimenta la sección "Esta semana" del home, ordenada por fecha de inicio.
 */
export const evento = defineType({
  name: "evento",
  title: "Evento / Agenda",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description: "La página del evento queda en /agenda/<slug>.",
      validation: (rule) => rule.required(),
    }),
    verticalField(),
    defineField({
      name: "inicio",
      title: "Fecha y hora de inicio",
      type: "datetime",
      options: { timeStep: 15 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fin",
      title: "Fin (opcional)",
      type: "datetime",
      description: "Para eventos de varios días o con hora de cierre.",
      validation: (rule) =>
        rule.min(rule.valueOfField("inicio")).error("El fin debe ser posterior al inicio."),
    }),
    defineField({
      name: "horaPorConfirmar",
      title: "Hora por confirmar",
      type: "boolean",
      description: "Actívalo si aún no hay hora oficial: el sitio muestra solo la fecha.",
      initialValue: false,
    }),
    defineField({
      name: "lugar",
      title: "Lugar",
      type: "string",
      description: "Nombre del sitio o zona (ej. Anfiteatro Coca-Cola).",
    }),
    defineField({
      name: "descripcion",
      title: "Descripción corta",
      type: "text",
      rows: 3,
      description: "Resumen de una o dos líneas (listados y buscadores).",
    }),
    defineField({
      name: "cuerpo",
      title: "Detalle del evento",
      type: "array",
      of: [{ type: "block" }],
      description: "Descripción larga para la página del evento (opcional).",
    }),
    defineField({
      name: "imagen",
      title: "Imagen",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
    }),
    defineField({
      name: "enlace",
      title: "Enlace de entradas / info",
      type: "url",
      description: 'Alimenta el botón "Comprar entradas" de la página del evento.',
    }),
    defineField({
      name: "precioDesde",
      title: "Precio desde (opcional)",
      type: "string",
      description: 'Ej. "Desde ₡25.000". Dejar vacío si no hay dato oficial.',
    }),
    defineField({
      name: "organizador",
      title: "Organizador (opcional)",
      type: "string",
    }),
    defineField({
      name: "mapaUrl",
      title: "Enlace a Google Maps (opcional)",
      type: "url",
    }),
  ],
  orderings: [
    {
      title: "Próximos primero",
      name: "inicioAsc",
      by: [{ field: "inicio", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "lugar", media: "imagen" },
  },
});
