/**
 * Siembra puntual de la agenda 2026 (hoja del equipo) → Sanity.
 * Protegido con CRON_SECRET; se dispara a mano con curl:
 *   curl -H "Authorization: Bearer $CRON_SECRET" .../api/admin/sembrar-agenda
 *
 * Idempotente dos veces: _id determinístico (agenda-2026-<slug>) y además
 * salta cualquier evento cuyo slug ya exista en el dataset (aunque lo haya
 * creado el equipo desde el Studio con otro _id). Los eventos que ya
 * estaban en Sanity (Miss Grand, SIFAIS, Arjona, OSN, Expovino, Greeicy,
 * Ballet, Yandel) NO van en esta lista para no duplicarlos.
 *
 * La hoja no trae horas: todo entra con `horaPorConfirmar` (el sitio
 * muestra solo la fecha) salvo Jon Batiste, cuya hora está confirmada
 * por prensa. Duerme sin SANITY_API_WRITE_TOKEN.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";

export const runtime = "nodejs";
export const maxDuration = 120;

type EventoSemilla = {
  slug: string;
  title: string;
  vertical: string;
  /** ISO con offset -06:00; mediodía cuando la hora real no se conoce. */
  inicio: string;
  fin?: string;
  horaPorConfirmar: boolean;
  lugar: string;
  descripcion?: string;
  artista?: string;
  precioDesde?: string;
  enlace?: string;
};

const EVENTOS: EventoSemilla[] = [
  {
    slug: "safe-and-sound-2026",
    title: "Safe and Sound",
    vertical: "entretenimiento",
    inicio: "2026-08-08T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Real InterContinental",
    enlace: "https://www.instagram.com/safesoundcr/",
  },
  {
    slug: "mujercitas-teatro-nacional",
    title: "Mujercitas",
    vertical: "cultura",
    inicio: "2026-08-08T12:00:00-06:00",
    fin: "2026-08-16T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional",
    descripcion: "Funciones el 8, 9 y 16 de agosto en el Teatro Nacional.",
    enlace: "https://www.instagram.com/mujercitascostarica/",
  },
  {
    slug: "despertar-de-primavera",
    title: "Despertar de Primavera",
    vertical: "cultura",
    // Temporada en curso: entra desde hoy para que aparezca vigente.
    inicio: "2026-08-11T12:00:00-06:00",
    fin: "2026-08-16T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Eugene O'Neill",
    descripcion: "En temporada hasta el 16 de agosto.",
    enlace: "https://www.instagram.com/oakprodcr/",
  },
  {
    slug: "feria-internacional-del-libro-2026",
    title: "Feria Internacional del Libro",
    vertical: "cultura",
    inicio: "2026-08-22T12:00:00-06:00",
    fin: "2026-08-30T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Antigua Aduana",
    descripcion: "Del sábado 22 al domingo 30 de agosto en la Antigua Aduana.",
    enlace: "https://www.instagram.com/feriainternacionaldellibrocr/",
  },
  {
    slug: "aca-el-color-es-identidad",
    title: "Lanzamiento ACA: El Color es Identidad",
    vertical: "cultura",
    inicio: "2026-08-27T12:00:00-06:00",
    fin: "2026-08-30T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Casa Rituo (contiguo a Arteria)",
    enlace: "https://www.instagram.com/ericazeledoncr/",
  },
  {
    slug: "premios-acam-2026",
    title: "Premios ACAM 2026",
    vertical: "entretenimiento",
    inicio: "2026-09-01T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Auditorio Nacional",
    enlace: "https://www.instagram.com/acamcostarica/",
  },
  {
    slug: "jon-batiste-orquesta-filarmonica",
    title: "Jon Batiste y la Orquesta Filarmónica",
    vertical: "entretenimiento",
    inicio: "2026-09-03T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Primer concierto de Jon Batiste en Costa Rica, junto a la Orquesta Filarmónica.",
    artista: "Jon Batiste",
    precioDesde: "Desde ₡32.500",
    enlace: "https://www.instagram.com/magflow_live/",
  },
  {
    slug: "caifanes-parque-viva-2026",
    title: "Caifanes",
    vertical: "entretenimiento",
    inicio: "2026-09-06T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Parque Viva",
    artista: "Caifanes",
    enlace: "https://www.instagram.com/jogolatam/",
  },
  {
    slug: "tini-futttura-world-tour",
    title: "TINI — Futttura World Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-10T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Parque Viva",
    artista: "TINI",
    enlace: "https://www.instagram.com/onecr/",
  },
  {
    slug: "lenny-tavarez-justin-quiles",
    title: "Lenny Tavárez & Justin Quiles",
    vertical: "entretenimiento",
    inicio: "2026-09-12T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Centro de Eventos Pedregal",
    artista: "Lenny Tavárez & Justin Quiles",
    enlace: "https://www.instagram.com/jogolatam/",
  },
  {
    slug: "cazzu-latinaje-tour",
    title: "Cazzu — Latinaje Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-19T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Parque Viva",
    artista: "Cazzu",
    enlace: "https://www.instagram.com/plus.entertainmentcr/",
  },
  {
    slug: "connecturday-2026",
    title: "ConnecturDay 2026",
    vertical: "entretenimiento",
    inicio: "2026-09-19T12:00:00-06:00",
    fin: "2026-09-20T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Centro de Convenciones",
    enlace: "https://www.instagram.com/connecturday_ca/",
  },
  {
    slug: "rebelion-en-la-granja",
    title: "Rebelión en la Granja",
    vertical: "cultura",
    inicio: "2026-08-11T12:00:00-06:00",
    fin: "2026-09-20T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Espressivo",
    descripcion: "En temporada hasta el 20 de setiembre.",
    enlace: "https://www.instagram.com/espressivocr/",
  },
  {
    slug: "natalia-lafourcade-cancionera-tour",
    title: "Natalia Lafourcade — Cancionera Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-24T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Parque Viva",
    artista: "Natalia Lafourcade",
    enlace: "https://www.instagram.com/arrecife.crc/",
  },
  {
    slug: "musica-en-el-museo",
    title: "Música en el Museo",
    vertical: "cultura",
    inicio: "2026-09-27T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Jardín principal del Museo Nacional",
    enlace: "https://www.museocostarica.go.cr/novedades/agenda/conciertos/",
  },
  {
    slug: "el-principito-espressivo",
    title: "El Principito",
    vertical: "cultura",
    inicio: "2026-08-11T12:00:00-06:00",
    fin: "2026-09-27T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Espressivo",
    descripcion: "En temporada hasta el 27 de setiembre.",
    enlace: "https://www.instagram.com/espressivocr/",
  },
  {
    slug: "oktoberfest-cr-2026",
    title: "Oktoberfest CR",
    vertical: "gastronomia",
    inicio: "2026-10-02T12:00:00-06:00",
    fin: "2026-10-10T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Centro de Eventos Pedregal",
    descripcion: "Fines de semana del 2 al 10 de octubre.",
    enlace: "https://www.instagram.com/oktober_cr/",
  },
];

export async function GET(req: Request) {
  if (!cronAutorizado(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!escrituraSanityHabilitada) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta SANITY_API_WRITE_TOKEN en Vercel.",
    });
  }
  const db = getWriteClient()!;

  // Guardia anti-duplicado por slug: respeta lo creado desde el Studio.
  const slugsExistentes = new Set<string>(
    await db.fetch<string[]>(
      /* groq */ `*[_type == "evento" && defined(slug.current)].slug.current`
    )
  );

  const creados: string[] = [];
  const yaExistian: string[] = [];
  const fallidos: { evento: string; motivo: string }[] = [];
  for (const e of EVENTOS) {
    if (slugsExistentes.has(e.slug)) {
      yaExistian.push(e.title);
      continue;
    }
    try {
      await db.createIfNotExists({
        _id: `agenda-2026-${e.slug}`,
        _type: "evento",
        title: e.title,
        slug: { _type: "slug", current: e.slug },
        vertical: e.vertical,
        inicio: e.inicio,
        ...(e.fin ? { fin: e.fin } : {}),
        horaPorConfirmar: e.horaPorConfirmar,
        lugar: e.lugar,
        ...(e.descripcion ? { descripcion: e.descripcion } : {}),
        ...(e.artista ? { artista: e.artista } : {}),
        ...(e.precioDesde ? { precioDesde: e.precioDesde } : {}),
        ...(e.enlace ? { enlace: e.enlace } : {}),
      });
      creados.push(e.title);
    } catch (err) {
      fallidos.push({
        evento: e.title,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  if (creados.length > 0) {
    revalidatePath("/");
    revalidatePath("/agenda");
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    total: EVENTOS.length,
    creados,
    yaExistian,
    fallidos,
  });
}
