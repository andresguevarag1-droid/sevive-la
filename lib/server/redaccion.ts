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
  /** true = la hora de `inicio` es relleno: la ficha solo muestra la fecha. */
  horaPorConfirmar?: boolean;
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

function fmtFechaCR(iso?: string, conHora = true): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(conHora
      ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false }
      : {}),
    timeZone: "America/Costa_Rica",
  }).format(d);
}

function fichaEvento(e: DatosEvento): string {
  // Con hora por confirmar, la ficha omite la hora (es un relleno) y se lo
  // dice a Claude para que escriba alrededor sin afirmarla.
  const conHora = !e.horaPorConfirmar;
  const filas = [
    `Título: ${e.title}`,
    `Vertical: ${e.vertical}`,
    e.inicio ? `Inicio: ${fmtFechaCR(e.inicio, conHora)}` : "",
    e.fin ? `Fin: ${fmtFechaCR(e.fin, conHora)}` : "",
    e.horaPorConfirmar ? "Hora: por confirmar (todavía no hay hora oficial)" : "",
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

const ESQUEMA_EVENTO_IG = {
  type: "object" as const,
  properties: {
    esEventoNuevo: {
      type: "boolean",
      description:
        "true SOLO si el post anuncia UN evento concreto con fecha identificable Y no coincide con ninguno de la lista de eventos existentes.",
    },
    titulo: {
      type: "string",
      description: "Nombre editorial del evento, máx. 100 caracteres.",
    },
    fecha: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "Fecha del evento en formato YYYY-MM-DD, o null si no se puede determinar con certeza.",
    },
    hora: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: 'Hora de inicio "HH:MM" (24h) SOLO si el texto la dice; si no, null.',
    },
    lugar: { anyOf: [{ type: "string" }, { type: "null" }] },
    precioDesde: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: 'Ej. "Desde ₡25.000", solo si el texto lo dice.',
    },
    vertical: {
      type: "string",
      enum: [
        "experiencias",
        "entretenimiento",
        "cultura",
        "ocio",
        "gastronomia",
        "turismo",
        "estilo-de-vida",
      ],
    },
    descripcion: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "1-2 frases factuales tomadas del texto del post.",
    },
  },
  required: [
    "esEventoNuevo",
    "titulo",
    "fecha",
    "hora",
    "lugar",
    "precioDesde",
    "vertical",
    "descripcion",
  ],
  additionalProperties: false,
};

export type EventoExtraido = {
  esEventoNuevo: boolean;
  titulo: string;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
  precioDesde: string | null;
  vertical: string;
  descripcion: string | null;
};

/**
 * ¿Este post de Instagram anuncia un evento? Extrae los datos del caption
 * (NUNCA inventa: lo que no está, va null) y descarta duplicados contra la
 * lista de eventos ya publicados en la agenda.
 */
export async function extraerEventoDeIg(
  caption: string,
  fechaPost: string,
  eventosExistentes: { titulo: string; fecha: string }[]
): Promise<EventoExtraido | null> {
  if (!redaccionHabilitada) return null;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: ESQUEMA_EVENTO_IG },
    },
    system: `Analizás posts de Instagram de SeViveLa (medio de Costa Rica) para detectar anuncios de eventos y volcarlos a la agenda del sitio.

Reglas:
- esEventoNuevo=true SOLO si el post anuncia UN evento concreto (concierto, feria, obra, festival...) con fecha identificable. Posts de ambiente, memes, sorteos, coberturas de eventos pasados o compilados de varios planes: false.
- NUNCA inventés datos: lo que el texto no diga va en null.
- La fecha completa se deduce del texto + la fecha del post (mismo año del post; si el mes ya pasó respecto al post, probablemente es del año siguiente). Si no hay certeza: null.
- Si el evento coincide con uno de la lista de existentes (mismo nombre aproximado y fecha cercana), esEventoNuevo=false.`,
    messages: [
      {
        role: "user",
        content: `Post publicado el ${fechaPost}.\n\nCaption:\n${caption.slice(0, 3000)}\n\nEventos ya en la agenda (no duplicar):\n${eventosExistentes.map((e) => `- ${e.titulo} (${e.fecha})`).join("\n") || "(ninguno)"}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const bloque = response.content.find((b) => b.type === "text");
  if (!bloque || bloque.type !== "text") return null;
  try {
    return JSON.parse(bloque.text) as EventoExtraido;
  } catch {
    return null;
  }
}

const ESQUEMA_REVISION = {
  type: "object" as const,
  properties: {
    ...ESQUEMA_ARTICULO.properties,
    cambios: {
      type: "array",
      items: { type: "string" },
      description:
        "Lista corta de lo corregido (ej. 'tilde en «qué»', 'concordancia en la intro'). Vacía si no hizo falta tocar nada.",
    },
  },
  required: ["titulo", "bajada", "secciones", "cambios"],
  additionalProperties: false,
};

const CORRECTOR = `Sos el corrector de estilo de SeViveLa, revista digital de Costa Rica.

Tu trabajo: pulir un artículo YA escrito para dejarlo listo para publicar.
- Corregí ortografía, tildes, puntuación, concordancia y gramática.
- Voseo costarricense correcto y consistente ("tenés", "querés"; jamás "tienes").
- Eliminá muletillas de IA ("sumérgete", "no te lo puedes perder", "una experiencia única"), redundancias y rimbombancias; que suene a revista impresa.
- Podés reescribir oraciones torpes, pero SIN cambiar el contenido.

Reglas duras:
- NUNCA cambiés datos duros (fechas, horas, precios, nombres, lugares, cifras) ni agregués información nueva.
- Los marcadores con el formato [COMPLETAR: …] se conservan EXACTOS, en su propio párrafo.
- Conservá la estructura de secciones (misma cantidad, mismos subtítulos salvo error ortográfico en ellos).
- En "cambios" listá brevemente qué corregiste; si el texto ya estaba bien, devolvelo igual y dejá "cambios" vacía.`;

/**
 * Revisión de estilo de un artículo existente: devuelve el texto corregido
 * y la lista de cambios. null si Claude declina o la forma no calza.
 */
export async function revisarArticulo(articulo: {
  titulo: string;
  bajada: string;
  secciones: ArticuloRedactado["secciones"];
}): Promise<{ articulo: ArticuloRedactado & { titulo: string; bajada: string }; cambios: string[] } | null> {
  if (!redaccionHabilitada) return null;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: ESQUEMA_REVISION },
    },
    system: CORRECTOR,
    messages: [
      {
        role: "user",
        content: `Revisá y corregí este artículo (JSON):\n${JSON.stringify(articulo)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const bloque = response.content.find((b) => b.type === "text");
  if (!bloque || bloque.type !== "text") return null;
  try {
    const rev = JSON.parse(bloque.text) as ArticuloRedactado & { cambios?: string[] };
    if (
      typeof rev.titulo !== "string" ||
      typeof rev.bajada !== "string" ||
      !Array.isArray(rev.secciones) ||
      rev.secciones.length === 0
    ) {
      return null;
    }
    return {
      articulo: {
        titulo: rev.titulo.slice(0, 110),
        bajada: rev.bajada.slice(0, 220),
        secciones: rev.secciones,
      },
      cambios: Array.isArray(rev.cambios) ? rev.cambios.slice(0, 12) : [],
    };
  } catch {
    console.error("[redaccion] revisión no parseable para", articulo.titulo);
    return null;
  }
}
