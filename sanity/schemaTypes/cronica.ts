import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Crónica / artículo (equipo de blog y ediciones).
 * Alimenta la nota líder de portada y las notas destacadas del home.
 */
export const cronica = defineType({
  name: "cronica",
  title: "Crónica / Artículo",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    verticalField(),
    defineField({
      name: "bajada",
      title: "Bajada",
      type: "text",
      rows: 2,
      description: "Resumen de una o dos líneas que aparece bajo el título.",
      validation: (rule) => rule.max(220),
    }),
    defineField({
      name: "autor",
      title: "Autor / Firma",
      type: "string",
      initialValue: "Redacción SeViveLa",
    }),
    defineField({
      name: "formato",
      title: "Formato",
      type: "string",
      description: "Etiqueta corta: Crónica, Guía, Ensayo, Reseña…",
      initialValue: "Crónica",
    }),
    defineField({
      name: "lecturaMin",
      title: "Minutos de lectura",
      type: "number",
      validation: (rule) => rule.min(1).max(60),
    }),
    defineField({
      name: "imagen",
      title: "Imagen de portada",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
          description: "Describe la imagen (accesibilidad y SEO).",
        }),
      ],
    }),
    defineField({
      name: "cuerpo",
      title: "Cuerpo de la nota",
      type: "array",
      of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "fecha",
      title: "Fecha de publicación",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "esPortada",
      title: "Nota líder de portada",
      type: "boolean",
      description:
        "Marca UNA sola crónica como la nota principal del home. Si hay varias, se usa la más reciente.",
      initialValue: false,
    }),
    defineField({
      name: "destacada",
      title: "Destacada en el home",
      type: "boolean",
      description: 'Aparece en la sección "Destacado".',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Más recientes",
      name: "fechaDesc",
      by: [{ field: "fecha", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "vertical", media: "imagen" },
  },
});
