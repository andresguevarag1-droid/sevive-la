import { defineField, defineType } from "sanity";

/**
 * Transmisión en vivo — el interruptor del "🔴 EN VIVO".
 * El equipo transmite desde OBS a YouTube (video oculto/no listado), pega
 * aquí el enlace y ENCIENDE `activa`: la banda aparece en el home y el
 * video se reproduce dentro de /en-vivo con el branding del sitio.
 * Al apagarla, todo desaparece al instante. Sin deploy.
 */
export const transmision = defineType({
  name: "transmision",
  title: "Transmisión en vivo",
  type: "document",
  fields: [
    defineField({
      name: "titulo",
      title: "Título de la transmisión",
      type: "string",
      description: 'Ej. "Cobertura en vivo: Oktoberfest CR 2026".',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "activa",
      title: "🔴 EN VIVO (encender al empezar, apagar al terminar)",
      type: "boolean",
      description:
        "ENCENDIDA: la banda EN VIVO aparece en el home y el video se ve en /en-vivo. APAGADA: la página queda en reposo.",
      initialValue: false,
    }),
    defineField({
      name: "youtubeUrl",
      title: "Enlace del video de YouTube",
      type: "url",
      description:
        "El enlace de la emisión (sirve cualquiera: youtube.com/watch?v=…, youtu.be/…, youtube.com/live/…). Con el video como «No listado», solo se ve dentro del sitio.",
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom((valor?: string) => {
          if (!valor) return true;
          return /youtube\.com|youtu\.be/.test(valor)
            ? true
            : "Debe ser un enlace de YouTube.";
        }),
    }),
    defineField({
      name: "descripcion",
      title: "Descripción corta",
      type: "text",
      rows: 2,
      description: "Una o dos líneas sobre qué se está transmitiendo (opcional).",
    }),
    defineField({
      name: "programadaPara",
      title: "Programada para (opcional)",
      type: "datetime",
      options: { timeStep: 15 },
      description:
        "Si la anunciás con anticipación, la página /en-vivo muestra la fecha y la gente puede dejar su correo para que le avisemos.",
    }),
  ],
  preview: {
    select: { title: "titulo", activa: "activa", programadaPara: "programadaPara" },
    prepare({ title, activa, programadaPara }) {
      const cuando = programadaPara
        ? new Date(programadaPara).toLocaleDateString("es-CR", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      return {
        title: `${activa ? "🔴 EN VIVO" : "⚪"} ${title}`,
        subtitle: activa ? "Transmitiendo ahora" : cuando || "En reposo",
      };
    },
  },
});
