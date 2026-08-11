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
 * Datos enriquecidos con investigación de prensa y ticketeras (ago 2026):
 * horas, precios, organizadores y enlaces de compra verificados; lo no
 * confirmado queda con `horaPorConfirmar` o sin el campo (nunca se
 * inventa). Regla del dueño: nada anterior al 10 de agosto de 2026
 * (Safe and Sound, 8 ago, quedó fuera). Duerme sin SANITY_API_WRITE_TOKEN.
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
  organizador?: string;
  precioDesde?: string;
  enlace?: string;
};

const EVENTOS: EventoSemilla[] = [
  {
    // Solo queda la función del dom 16 (las del 8 y 9 ya pasaron).
    slug: "mujercitas-teatro-nacional",
    title: "Mujercitas",
    vertical: "cultura",
    inicio: "2026-08-16T11:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Cierre de la tercera temporada de la adaptación costarricense de la novela de Louisa May Alcott, por Akelarre CR Producciones. Funciones a las 11:00 a. m. y 5:00 p. m.",
    organizador: "Akelarre CR Producciones",
    precioDesde: "Desde ₡5.500",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "despertar-de-primavera",
    title: "Despertar de Primavera",
    vertical: "cultura",
    // Próxima función confirmada: jueves 13 a las 7:30 p. m.
    inicio: "2026-08-13T19:30:00-06:00",
    fin: "2026-08-16T23:59:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Eugene O'Neill",
    descripcion:
      "Primera producción costarricense del musical de Broadway ganador de 8 premios Tony, con orquesta en vivo. Funciones de jueves a domingo, hasta el 16 de agosto.",
    organizador: "OAK Producciones",
    precioDesde: "Desde ₡14.200",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9484",
  },
  {
    slug: "feria-internacional-del-libro-2026",
    title: "Feria Internacional del Libro",
    vertical: "cultura",
    inicio: "2026-08-22T09:00:00-06:00",
    fin: "2026-08-30T18:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Antigua Aduana",
    descripcion:
      "XXIV edición de la FILCR, con Guatemala como país invitado de honor y más de 200 actividades. Todos los días de 9:00 a. m. a 8:00 p. m. (el domingo 30, hasta las 6:00 p. m.).",
    organizador: "Cámara Costarricense del Libro",
    precioDesde: "Entrada gratuita",
    enlace: "https://www.filcr.com/",
  },
  {
    // Anunciado solo en redes: sin datos verificables en prensa aún.
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
    lugar: "Auditorio Nacional (Museo de los Niños)",
    descripcion:
      "Vigésima gala de los premios de la música costarricense: 29 categorías y, por primera vez, el Premio del Público elegido por voto popular.",
    organizador: "Asociación de Compositores y Autores Musicales (ACAM)",
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
      "Primer concierto en Costa Rica del pianista ganador de un Óscar y ocho Grammy, junto a la Orquesta Filarmónica de Costa Rica. Puertas a las 4:00 p. m.",
    artista: "Jon Batiste",
    precioDesde: "Desde ₡32.500",
    enlace: "https://www.publitickets.com",
  },
  {
    slug: "caifanes-parque-viva-2026",
    title: "Caifanes",
    vertical: "entretenimiento",
    inicio: "2026-09-06T20:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "La banda mexicana de rock regresa a Costa Rica en su gira 2026 por Latinoamérica. Evento para mayores de 12 años.",
    artista: "Caifanes",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9396",
  },
  {
    slug: "tini-futttura-world-tour",
    title: "TINI — Futttura World Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-10T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "Debut de TINI en Costa Rica con su gira Futttura World Tour: un show en tres actos con banda en vivo, bailarines y pantallas de gran formato.",
    artista: "TINI",
    organizador: "ONE Entertainment",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9379",
  },
  {
    slug: "lenny-tavarez-justin-quiles",
    title: "Lenny Tavárez & Justin Quiles",
    vertical: "entretenimiento",
    inicio: "2026-09-12T20:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Centro de Eventos Pedregal",
    descripcion:
      "Concierto conjunto dentro de la gira Superarte, que acompaña el álbum colaborativo de ambos artistas urbanos. Solo mayores de 18 años.",
    artista: "Lenny Tavárez & Justin Quiles",
    enlace: "https://www.eticket.cr/eventos.aspx?idlugar=473",
  },
  {
    slug: "cazzu-latinaje-tour",
    title: "Cazzu — Latinaje Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-19T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Primera visita de Cazzu a Costa Rica, dentro de su gira internacional Latinaje.",
    artista: "Cazzu",
    organizador: "Plus Entertainment",
    precioDesde: "Desde ₡57.500",
    enlace: "https://www.publitickets.com",
  },
  {
    slug: "connecturday-2026",
    title: "ConnecturDay 2026",
    vertical: "entretenimiento",
    inicio: "2026-09-19T12:00:00-06:00",
    fin: "2026-09-20T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Centro de Convenciones de Costa Rica",
    descripcion:
      "15.º aniversario de la convención geek, gamer y anime: torneos de videojuegos, zonas comerciales e invitados internacionales como Mario Castañeda (voz de Goku) y Natalia Tena.",
    organizador: "Geeksplace",
    precioDesde: "Desde ₡12.000",
    enlace: "https://smarticket.net/evento.php?id=239",
  },
  {
    slug: "rebelion-en-la-granja",
    title: "Rebelión en la Granja",
    vertical: "cultura",
    // Próxima función tras el 10 de agosto: viernes 14, 8:00 p. m.
    inicio: "2026-08-14T20:00:00-06:00",
    fin: "2026-09-20T23:59:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Espressivo",
    descripcion:
      "Adaptación costarricense del clásico de George Orwell, dirigida por Manuel «Momo» Martín. Funciones viernes y sábado 8:00 p. m. y domingo 6:00 p. m., hasta el 20 de setiembre.",
    organizador: "Teatro Espressivo",
    precioDesde: "Desde ₡12.500",
    enlace: "https://boleteria.espressivo.cr",
  },
  {
    slug: "natalia-lafourcade-cancionera-tour",
    title: "Natalia Lafourcade — Cancionera Tour",
    vertical: "entretenimiento",
    inicio: "2026-09-24T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Regreso de Natalia Lafourcade a Costa Rica tras ocho años, con el repertorio de su álbum Cancionera y clásicos de su carrera.",
    artista: "Natalia Lafourcade",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9408",
  },
  {
    slug: "musica-en-el-museo",
    title: "Música en el Museo",
    vertical: "cultura",
    inicio: "2026-09-27T11:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Jardín principal del Museo Nacional",
    descripcion:
      "Ciclo mensual de conciertos al aire libre en el jardín del Museo Nacional, a cargo de la Banda de Conciertos de San José. Gratis para nacionales y residentes con identificación.",
    organizador: "Museo Nacional de Costa Rica",
    precioDesde: "Entrada gratuita (nacionales y residentes)",
    enlace: "https://www.museocostarica.go.cr/novedades/agenda/conciertos/",
  },
  {
    slug: "el-principito-espressivo",
    title: "El Principito",
    vertical: "cultura",
    // Próxima función: domingo 16, 2:00 p. m.
    inicio: "2026-08-16T14:00:00-06:00",
    fin: "2026-09-27T23:59:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Espressivo",
    descripcion:
      "Adaptación de la obra de Saint-Exupéry que combina teatro, circo contemporáneo y música original: seis artistas interpretan más de veinte personajes. Funciones los domingos a las 2:00 p. m., hasta el 27 de setiembre.",
    organizador: "Espressivo Producciones y Parque La Libertad",
    precioDesde: "Desde ₡9.000",
    enlace: "https://boleteria.espressivo.cr/eventperformances.asp?evt=503",
  },
  {
    slug: "oktoberfest-cr-2026",
    title: "Oktoberfest Costa Rica 2026",
    vertical: "gastronomia",
    inicio: "2026-10-02T12:00:00-06:00",
    fin: "2026-10-04T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Centro de Eventos Pedregal",
    descripcion:
      "XIII edición del festival cervecero: cervecerías nacionales y artesanales, gastronomía y conciertos en dos tarimas, del viernes 2 al domingo 4 de octubre. Además, jornada «Oktoberfest Village» el sábado 10 de octubre en Nébula Center.",
    organizador: "Nunu Producciones",
    enlace: "https://www.nunucr.com/oktoberfest",
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
        ...(e.organizador ? { organizador: e.organizador } : {}),
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
