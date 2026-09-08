import { defineField, defineType } from "sanity";

/**
 * Capítulo del show de SeViveLa (TV → YouTube → el sitio).
 * Cada lunes el canal recibe el programa de la semana anterior: el cron
 * de capítulos los agrega solo; este esquema también permite pegarlos a
 * mano. Se ven en /capitulos dentro del televisor retro (misma estética
 * que /en-vivo, para ir familiarizando a la audiencia).
 */
export const capitulo = defineType({
  name: "capitulo",
  title: "Capítulo del show",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título del capítulo",
      type: "string",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "youtubeUrl",
      title: "Enlace del video de YouTube",
      type: "url",
      description:
        "Sirve cualquiera: youtube.com/watch?v=…, youtu.be/…, youtube.com/live/….",
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ["https"] })
          .custom((valor?: string) => {
            if (!valor) return true;
            return /youtube\.com|youtu\.be/.test(valor)
              ? true
              : "Debe ser un enlace de YouTube.";
          }),
    }),
    defineField({
      name: "numero",
      title: "Número de capítulo (opcional)",
      type: "number",
      description: "Ej. 3 — se muestra como «Capítulo 3».",
      validation: (rule) => rule.min(1).max(999),
    }),
    defineField({
      name: "fecha",
      title: "Fecha de emisión",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "descripcion",
      title: "Descripción corta",
      type: "text",
      rows: 3,
      description: "Qué trae este capítulo (opcional, 1–2 líneas).",
    }),
  ],
  orderings: [
    {
      title: "Más recientes primero",
      name: "fechaDesc",
      by: [{ field: "fecha", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "titulo", numero: "numero", fecha: "fecha" },
    prepare({ title, numero, fecha }) {
      const dia = fecha
        ? new Date(fecha).toLocaleDateString("es-CR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";
      return {
        title: `${numero ? `Cap. ${numero} · ` : ""}${title}`,
        subtitle: dia,
      };
    },
  },
});
