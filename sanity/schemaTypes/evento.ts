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
    verticalField(),
    defineField({
      name: "inicio",
      title: "Fecha y hora de inicio",
      type: "datetime",
      options: { timeStep: 15 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lugar",
      title: "Lugar",
      type: "string",
      description: "Nombre del sitio o zona (ej. Anfiteatro Coca-Cola).",
    }),
    defineField({
      name: "descripcion",
      title: "Descripción",
      type: "text",
      rows: 3,
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
      title: "Enlace (entradas / info)",
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
