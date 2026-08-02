import { defineField, defineType } from "sanity";
import { verticalField } from "@/sanity/lib/verticals";

/**
 * Campaña — dinámica de alto impacto con hero propio en la home
 * (ej. "Latin Grammys 2026"). El equipo la activa, pausa y edita sin deploy.
 * La captura de datos vive en Supabase (campaign_entries), nunca aquí.
 */
export const campana = defineType({
  name: "campana",
  title: "Campaña (hero de home)",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Titular",
      type: "string",
      description: 'Ej. "Ponemos los Latin Grammys a tus pies".',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "subtitulo",
      title: "Subtítulo",
      type: "text",
      rows: 2,
      description: 'Ej. "Ganate un viaje a los Latin Grammys 2026 en Las Vegas."',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "titulo", maxLength: 96 },
      description: "La landing queda en /dinamicas/<slug>.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "activa",
      title: "Campaña activa",
      type: "boolean",
      description:
        "ENCENDIDA: el hero aparece en la home y el formulario acepta participaciones (dentro de las fechas). APAGADA: todo se oculta al instante.",
      initialValue: false,
    }),
    verticalField(),
    defineField({
      name: "imagenHero",
      title: "Arte de la campaña (flyer)",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
      description: "El flyer de la campaña (se muestra junto al texto del hero).",
    }),
    defineField({
      name: "ogImage",
      title: "Imagen para compartir (og:image)",
      type: "image",
      description:
        "Versión horizontal 1200×630 del arte. Es lo que se ve al pegar el link en IG/WhatsApp. Si falta, se usa el arte del flyer.",
    }),
    defineField({
      name: "ctaTexto",
      title: "Texto del botón",
      type: "string",
      initialValue: "Participá gratis",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "microcopy",
      title: "Letra chica bajo el botón",
      type: "string",
      initialValue: "Válido solo para Costa Rica · Participar no cuesta nada",
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: "inicia",
      title: "Inicia",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "termina",
      title: "Termina",
      type: "datetime",
      validation: (rule) =>
        rule.required().min(rule.valueOfField("inicia")).error("Debe terminar después de iniciar."),
    }),
    defineField({
      name: "premio",
      title: "Premio (una línea)",
      type: "string",
      description: "Se usa en la landing y en la descripción para buscadores.",
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "patrocinador",
      title: "Marca patrocinadora",
      type: "string",
    }),
    defineField({
      name: "patrocinado",
      title: "Contenido patrocinado",
      type: "boolean",
      description: "Se etiqueta en el sitio si la marca pagó.",
      initialValue: false,
    }),
    defineField({
      name: "referidosActivos",
      title: "Referidos activos",
      type: "boolean",
      description:
        "ENCENDIDO: cada participante recibe un link personal y suma chances por cada amigo que participe con él. La mecánica debe estar descrita en las bases.",
      initialValue: true,
    }),
    defineField({
      name: "chancesMaxPorReferido",
      title: "Tope de chances extra por referidos",
      type: "number",
      description:
        "Máximo de chances bonus que puede acumular una persona (además de su chance base).",
      initialValue: 10,
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: "bases",
      title: "Bases y condiciones",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Organizador, premio exacto, requisitos (21+, pasaporte, visa), mecánica, fechas, sorteo y contacto. Se publican en /legal/bases/<slug>.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "titulo", subtitle: "slug.current", media: "imagenHero", activa: "activa" },
    prepare({ title, subtitle, media, activa }) {
      return {
        title: `${activa ? "🟢" : "⚪"} ${title}`,
        subtitle: `/dinamicas/${subtitle}`,
        media,
      };
    },
  },
});
