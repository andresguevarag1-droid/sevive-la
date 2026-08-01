import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Reel / Video vertical 9:16 (equipo de redes).
 * Se muestra en el rail "En video" del home.
 */
export const reel = defineType({
  name: "reel",
  title: "Reel / Video",
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
      name: "miniatura",
      title: "Miniatura (vertical 9:16)",
      type: "image",
      options: { hotspot: true },
      description: "Imagen de portada del reel. Idealmente vertical.",
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "videoUrl",
      title: "Enlace del video",
      type: "url",
      description:
        "URL del reel (Instagram, TikTok, YouTube o video propio). Se abre al tocar.",
    }),
    defineField({
      name: "duracion",
      title: "Duración",
      type: "string",
      description: 'Formato mm:ss, por ejemplo "1:04".',
    }),
    defineField({
      name: "fecha",
      title: "Fecha",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "orden",
      title: "Orden manual",
      type: "number",
      description: "Menor número aparece primero. Vacío = ordena por fecha.",
    }),
  ],
  orderings: [
    {
      title: "Orden manual",
      name: "ordenAsc",
      by: [
        { field: "orden", direction: "asc" },
        { field: "fecha", direction: "desc" },
      ],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "vertical", media: "miniatura" },
  },
});
