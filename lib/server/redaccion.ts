/**
 * Redacción automática de artículos con Claude — SOLO SERVIDOR.
 * Escribe en la voz editorial de SeViveLa (español de Costa Rica, voseo,
 * revista impresa) a partir de los datos reales del evento; NUNCA inventa
 * datos duros. Sin ANTHROPIC_API_KEY, duerme (igual que Resend).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** true cuando el robot puede redactar. */
export const redaccionHabilitada = Boolean(process.env.ANTHROPIC_API_KEY);

export type DatosEvento = {
  title: string;
  vertical: string;
  inicio?: string;
  fin?: string;
  lugar?: string;
  precioDesde?: string;
  artista?: string;
  organizador?: string;
  descripcion?: string;
  enlace?: string;
};

export type ArticuloRedactado = {
  titulo: string;
  bajada: string;
  secciones: { subtitulo: string | null; parrafos: string[] }[];
};

const ESQUEMA_ARTICULO = {
  type: "object" as const,
  properties: {
    titulo: {
      type: "string",
      description: "Titular editorial, máx. 90 caracteres, sin punto final.",
    },
    bajada: {
      type: "string",
      description: "Bajada de 1–2 líneas bajo el titular, máx. 200 caracteres.",
    },
    secciones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          subtitulo: {
            // anyOf en vez de type:[…]: la validación de salidas
            // estructuradas no acepta el arreglo de tipos.
            anyOf: [{ type: "string" }, { type: "null" }],
            description: "Subtítulo de la sección, o null para la intro.",
          },
          parrafos: { type: "array", items: { type: "string" } },
        },
        required: ["subtitulo", "parrafos"],
        additionalProperties: false,
      },
    },
  },
  required: ["titulo", "bajada", "secciones"],
  additionalProperties: false,
};

const VOZ_EDITORIAL = `Sos la redacción de SeViveLa, una revista digital de descubrimiento en Costa Rica (experiencias, entretenimiento, cultura, gastronomía, turismo, estilo de vida).

Voz editorial:
- Español de Costa Rica con voseo natural ("tenés", "querés", "andá").
- Tono de revista impresa: cercano pero bien escrito, con criterio propio. Ni comunicado de prensa ni influencer.
- Sin emojis, sin signos de exclamación en cadena, sin clichés de IA ("sumérgete", "no te lo puedes perder", "una experiencia única").
- Prosa: párrafos de 2 a 4 oraciones. Nada de listas con viñetas.

Regla de oro: NUNCA inventés datos duros (fechas, precios, horarios, nombres, cifras). Usá solo los datos provistos; si un dato falta, escribí alrededor sin afirmarlo.`;

function fmtFechaCR(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(d);
}

function fichaEvento(e: DatosEvento): string {
  const filas = [
    `Título: ${e.title}`,
    `Vertical: ${e.vertical}`,
    e.inicio ? `Inicio: ${fmtFechaCR(e.inicio)}` : "",
    e.fin ? `Fin: ${fmtFechaCR(e.fin)}` : "",
    e.lugar ? `Lugar: ${e.lugar}` : "",
    e.precioDesde ? `Precio: ${e.precioDesde}` : "",
    e.artista ? `Artista/elenco: ${e.artista}` : "",
    e.organizador ? `Organizador: ${e.organizador}` : "",
    e.descripcion ? `Descripción oficial: ${e.descripcion}` : "",
  ].filter(Boolean);
  return filas.join("\n");
}

/**
 * Redacta un borrador de artículo para un evento. `tipo`:
 *  - "guia": ANTES del evento — "lo que tenés que saber antes de ir" (SEO
 *    cuando la gente decide si va).
 *  - "cobertura": DESPUÉS del evento — esqueleto de "así se vivió" con
 *    marcadores [COMPLETAR: …] para lo vivencial que solo el equipo sabe.
 * Devuelve null si Claude declina o la respuesta no tiene la forma esperada.
 */
export async function redactarArticulo(
  tipo: "guia" | "cobertura",
  evento: DatosEvento
): Promise<ArticuloRedactado | null> {
  if (!redaccionHabilitada) return null;
  const client = new Anthropic();

  const encargo =
    tipo === "guia"
      ? `Escribí una GUÍA PREVIA del evento: "lo que tenés que saber antes de ir".
Estructura: intro que responda por qué este plan vale la pena (sección con subtitulo null), luego 2 o 3 secciones con subtítulo (qué esperar, datos prácticos con SOLO los datos provistos, consejos generales para disfrutarlo). Cierre breve invitando a guardar el plan. Entre 350 y 550 palabras en total.`
      : `Escribí el ESQUELETO DE COBERTURA del evento ya realizado: "así se vivió".
El equipo editorial estuvo ahí y va a completar el texto con fotos y detalles. Escribí una intro atmosférica basada SOLO en los datos reales (sección con subtitulo null) y 2 o 3 secciones con subtítulo. Donde falte información vivencial (ambiente, momentos, citas de asistentes), escribí un marcador en su propio párrafo con el formato [COMPLETAR: qué agregar aquí]. Entre 250 y 400 palabras contando los marcadores.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: ESQUEMA_ARTICULO },
    },
    system: VOZ_EDITORIAL,
    messages: [
      {
        role: "user",
        content: `${encargo}\n\nDatos reales del evento (la única fuente de verdad):\n${fichaEvento(evento)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    console.warn(`[redaccion] Claude declinó redactar "${evento.title}".`);
    return null;
  }
  const bloque = response.content.find((b) => b.type === "text");
  if (!bloque || bloque.type !== "text") return null;

  try {
    const articulo = JSON.parse(bloque.text) as ArticuloRedactado;
    if (
      typeof articulo.titulo !== "string" ||
      typeof articulo.bajada !== "string" ||
      !Array.isArray(articulo.secciones)
    ) {
      return null;
    }
    return {
      titulo: articulo.titulo.slice(0, 110),
      bajada: articulo.bajada.slice(0, 220),
      secciones: articulo.secciones,
    };
  } catch {
    console.error("[redaccion] respuesta no parseable para", evento.title);
    return null;
  }
}
