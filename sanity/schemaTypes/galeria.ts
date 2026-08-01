import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Galería de fotos (coberturas, ediciones, eventos).
 */
export const galeria = defineType({
  name: "galeria",
  title: "Galería",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    verticalField(),
    defineField({
      name: "descripcion",
      title: "Descripción",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "imagenes",
      title: "Imágenes",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Texto alternativo",
              type: "string",
            }),
          ],
        },
      ],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: "fecha",
      title: "Fecha",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "vertical", media: "imagenes.0" },
  },
});
