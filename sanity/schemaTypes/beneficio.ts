import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Beneficio / Promoción de marca aliada.
 * Índice restringido del home. El contenido patrocinado siempre va etiquetado.
 */
export const beneficio = defineType({
  name: "beneficio",
  title: "Beneficio / Promoción",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título del beneficio",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "marca",
      title: "Marca aliada",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    verticalField(),
    defineField({
      name: "detalle",
      title: "Detalle de la oferta",
      type: "string",
      description: 'Ej. "30% · código VIVELA30" o "2x1 entre semana".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "vigencia",
      title: "Vigencia",
      type: "date",
      description: "Último día en que aplica el beneficio.",
    }),
    defineField({
      name: "patrocinado",
      title: "Contenido patrocinado",
      type: "boolean",
      description: "Actívalo si la marca pagó por aparecer. Se etiqueta en el sitio.",
      initialValue: false,
    }),
    defineField({
      name: "orden",
      title: "Orden manual",
      type: "number",
      description: "Menor número aparece primero.",
    }),
  ],
  orderings: [
    {
      title: "Orden manual",
      name: "ordenAsc",
      by: [{ field: "orden", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "marca" },
  },
});
