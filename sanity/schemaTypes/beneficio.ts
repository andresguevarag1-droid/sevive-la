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
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description: "La página del beneficio queda en /promociones/<slug>.",
      validation: (rule) => rule.required(),
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
      validation: (rule) =>
        rule.custom((v?: string) =>
          v ? true : "Sin fecha de vigencia, el cupón queda publicado para siempre."
        ).warning(),
    }),
    defineField({
      name: "imagen",
      title: "Arte del cupón",
      type: "image",
      options: { hotspot: true },
      description:
        "Opcional. Sustituye el talón de color por esta imagen (ideal: arte cuadrado o vertical de la marca). Sin imagen, se usa el color de la sección con la oferta en grande.",
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
          description: "Describe la imagen (accesibilidad y SEO).",
        }),
      ],
      validation: (rule) =>
        rule.custom((img?: { asset?: unknown; alt?: string }) =>
          img?.asset && !img.alt
            ? "Agregá el texto alternativo de la imagen (accesibilidad y SEO)."
            : true
        ).warning(),
    }),
    defineField({
      name: "cupoMaximo",
      title: "Cupo máximo de cupones",
      type: "number",
      description:
        "Opcional. Cantidad máxima de cupones que se pueden emitir (ej. 50). Vacío = sin límite. El sitio muestra cuántos quedan.",
      validation: (rule) => rule.min(1).integer(),
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
    defineField({
      name: "cuponMedible",
      title: "Cupón medible (con canje en el local)",
      type: "boolean",
      description:
        "ENCENDIDO: la gente reclama un cupón único (código + QR) dejando su correo, y el local lo canjea una sola vez. Genera métricas de redención para la marca.",
      initialValue: false,
    }),
    defineField({
      name: "enlace",
      title: "Enlace de canje",
      type: "url",
      description:
        "Opcional. Web donde se canjea o compra (ej. la tienda de la marca). La página del cupón muestra un botón directo.",
    }),
    defineField({
      name: "instruccionesCanje",
      title: "Instrucciones de canje",
      type: "text",
      rows: 2,
      description: 'Ej. "Mostrá este código en caja antes de pedir. Válido de lunes a jueves."',
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
    select: {
      title: "title",
      marca: "marca",
      vigencia: "vigencia",
      patrocinado: "patrocinado",
      media: "imagen",
    },
    prepare({ title, marca, vigencia, patrocinado, media }) {
      let estado = "⚪ sin vigencia";
      if (vigencia) {
        // Fin del día en Costa Rica (UTC-6 fijo), no en la zona del navegador.
        const fin = new Date(`${vigencia}T23:59:59-06:00`);
        const dias = Math.ceil((fin.getTime() - Date.now()) / 86400000);
        estado =
          dias < 0
            ? "🔴 Vencido"
            : dias === 0
              ? "🟠 Vence hoy"
              : dias <= 7
                ? `🟠 Vence en ${dias} día${dias === 1 ? "" : "s"}`
                : "🟢 Vigente";
      }
      const partes = [estado, marca, patrocinado ? "patrocinado" : ""].filter(Boolean);
      return { title, subtitle: partes.join(" · "), media };
    },
  },
});
