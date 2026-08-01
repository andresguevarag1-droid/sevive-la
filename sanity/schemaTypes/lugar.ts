import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Lugar (restaurante, bar, destino, sitio cultural…).
 * Base para directorios y detalle por vertical.
 */
export const lugar = defineType({
  name: "lugar",
  title: "Lugar",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Nombre",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    verticalField(),
    defineField({
      name: "ubicacion",
      title: "Ubicación",
      type: "string",
      description: "Zona, ciudad o dirección corta.",
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
      name: "mapsUrl",
      title: "Enlace de Google Maps",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "ubicacion", media: "imagen" },
  },
});
