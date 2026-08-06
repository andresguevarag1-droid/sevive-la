import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Dinámica / Giveaway — la parte EDITORIAL (título, premio, bases, fechas).
 * La captura de datos de participantes vive en Supabase, nunca aquí.
 * Reglas legales: participación SIEMPRE gratuita; bases públicas;
 * patrocinio etiquetado.
 */
export const dinamica = defineType({
  name: "dinamica",
  title: "Dinámica / Giveaway",
  type: "document",
  fields: [
    defineField({
      name: "activa",
      title: "Activa (visible en el sitio)",
      type: "boolean",
      description:
        "Interruptor de emergencia: apagalo para retirar la dinámica del sitio al instante, aunque no haya llegado su fecha de cierre.",
      initialValue: true,
    }),
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      description: 'Ej. "Ganate una cena para dos en La Ventana".',
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
      name: "premio",
      title: "Premio",
      type: "string",
      description: "Qué se gana, en una línea clara.",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "descripcion",
      title: "Descripción",
      type: "array",
      of: [{ type: "block" }],
      description: "El texto editorial de la dinámica (qué es, cómo participar).",
    }),
    defineField({
      name: "imagen",
      title: "Imagen",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
      validation: (rule) =>
        rule.custom((img?: { asset?: unknown; alt?: string }) =>
          img?.asset && !img.alt
            ? "Agregá el texto alternativo de la imagen (accesibilidad y SEO)."
            : true
        ).warning(),
    }),
    defineField({
      name: "inicio",
      title: "Inicio de la dinámica",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "cierre",
      title: "Cierre de participaciones",
      type: "datetime",
      validation: (rule) =>
        rule.required().min(rule.valueOfField("inicio")).error("El cierre debe ser posterior al inicio."),
    }),
    defineField({
      name: "pregunta",
      title: "Pregunta del formulario (opcional)",
      type: "string",
      description:
        'Pregunta cualificadora, ej. "¿Con quién irías y por qué?". Si se deja vacía, el formulario solo pide los datos de contacto.',
    }),
    defineField({
      name: "marca",
      title: "Marca aliada",
      type: "string",
      description: "Marca que da el premio (si aplica).",
    }),
    defineField({
      name: "patrocinado",
      title: "Contenido patrocinado",
      type: "boolean",
      description: "Actívalo si la marca pagó por la dinámica. Se etiqueta en el sitio.",
      initialValue: false,
    }),
    defineField({
      name: "bases",
      title: "Bases legales",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Mecánica, fechas, premio, responsable y restricciones. Se publican en /legal/bases/<slug>. La participación NUNCA se cobra.",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Cierre más próximo",
      name: "cierreAsc",
      by: [{ field: "cierre", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      premio: "premio",
      inicio: "inicio",
      cierre: "cierre",
      activa: "activa",
      media: "imagen",
    },
    prepare({ title, premio, inicio, cierre, activa, media }) {
      const ahora = Date.now();
      const abierta =
        (!inicio || new Date(inicio).getTime() <= ahora) &&
        (!cierre || new Date(cierre).getTime() >= ahora);
      const estado =
        activa === false
          ? "⏸ Pausada"
          : inicio && new Date(inicio).getTime() > ahora
            ? "🕑 Por abrir"
            : abierta
              ? "🟢 Abierta"
              : "🔴 Cerrada";
      return { title, subtitle: [estado, premio].filter(Boolean).join(" · "), media };
    },
  },
});
