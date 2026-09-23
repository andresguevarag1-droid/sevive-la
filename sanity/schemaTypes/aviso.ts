import { defineField, defineType } from "sanity";

/**
 * Aviso — hero liviano de home para anuncios que NO son una dinámica/sorteo
 * (ej. "sintonizanos los viernes en OPA Canal 38"). Mismo look festivo que
 * el hero de campaña (components/aviso/hero-aviso.tsx replica su estética),
 * pero sin formulario ni captura de datos: es un cartel con un botón.
 * Si hay una campaña activa, esta se oculta — la campaña manda.
 */
export const aviso = defineType({
  name: "aviso",
  title: "Aviso (hero de home, sin dinámica)",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Titular",
      type: "string",
      description: 'Ej. "Sintonizanos en la tele todos los viernes".',
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "subtitulo",
      title: "Subtítulo",
      type: "text",
      rows: 2,
      description: 'Ej. "SeViveLa en vivo por OPA, Canal 38 — viernes 5:00 p. m."',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: "activo",
      title: "Aviso activo",
      type: "boolean",
      description:
        "ENCENDIDO: aparece en la home (si no hay una campaña/sorteo activo — esa manda primero). APAGADO: se oculta al instante.",
      initialValue: false,
    }),
    defineField({
      name: "imagenHero",
      title: "Arte del aviso (flyer, opcional)",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
      ],
    }),
    defineField({
      name: "ctaTexto",
      title: "Texto del botón",
      type: "string",
      initialValue: "Ver más",
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: "ctaHref",
      title: "Destino del botón",
      type: "string",
      description:
        'Ruta interna (ej. "/capitulos" o "/en-vivo") o URL completa. El botón lleva ahí.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "microcopy",
      title: "Letra chica bajo el botón",
      type: "string",
      validation: (rule) => rule.max(120),
    }),
  ],
  preview: {
    select: { title: "titulo", subtitle: "subtitulo", media: "imagenHero", activo: "activo" },
    prepare({ title, subtitle, media, activo }) {
      return {
        title: `${activo ? "🟢" : "⚪"} ${title}`,
        subtitle,
        media,
      };
    },
  },
});
