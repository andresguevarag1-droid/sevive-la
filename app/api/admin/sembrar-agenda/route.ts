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

  /* ── Ola 2 (investigación de prensa/ticketeras, 18 ago 2026) ── */
  {
    slug: "fiesta-de-la-lectura-2026",
    title: "Fiesta de la Lectura Costa Rica",
    vertical: "cultura",
    inicio: "2026-09-11T12:00:00-06:00",
    fin: "2026-09-13T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Antigua Aduana",
    descripcion:
      "Quinta edición del encuentro literario nacional: editoriales, autores y charlas durante tres días, con entrada gratuita.",
    organizador: "Ministerio de Cultura y Juventud",
    precioDesde: "Entrada gratuita",
  },
  {
    slug: "jorge-drexler-taraca",
    title: "Jorge Drexler — Gira Taracá",
    vertical: "entretenimiento",
    inicio: "2026-09-12T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Drexler vuelve a Costa Rica con «Taracá», acompañado de siete músicos: candombe uruguayo y sus clásicos.",
    artista: "Jorge Drexler",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9397",
  },
  {
    slug: "osn-viii-temporada-2026",
    title: "VIII Concierto de Temporada — Sinfónica Nacional",
    vertical: "cultura",
    inicio: "2026-09-25T12:00:00-06:00",
    fin: "2026-09-27T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Funciones de viernes y domingo de la Temporada Oficial 2026 de la OSN, dedicada a las playas de Costa Rica.",
    organizador: "Centro Nacional de la Música",
    precioDesde: "Desde ₡2.220",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "capmany-vive-2026",
    title: "Capmany Vive — El Concierto",
    vertical: "entretenimiento",
    inicio: "2026-10-03T20:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Concierto homenaje al rockero costarricense José Capmany en el Teatro Nacional.",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9406",
  },
  {
    slug: "gloria-trevi-parque-viva",
    title: "Gloria Trevi",
    vertical: "entretenimiento",
    inicio: "2026-10-04T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "Regreso de Gloria Trevi a Costa Rica tras 15 años. Segunda fecha (domingo 4, mayores de 15): la del sábado 3 se agotó.",
    artista: "Gloria Trevi",
    precioDesde: "Desde ₡42.500",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9409",
  },
  {
    slug: "iron-maiden-2026",
    title: "Iron Maiden — Run For Your Lives",
    vertical: "entretenimiento",
    inicio: "2026-10-08T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Estadio Nacional",
    descripcion:
      "La gira del 50 aniversario de Iron Maiden vuelve al Estadio Nacional, con The Raven Age como banda invitada.",
    artista: "Iron Maiden",
    organizador: "Move Concerts",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9251",
  },
  {
    slug: "ana-torroja-2026",
    title: "Ana Torroja — Se Ha Acabado el Show",
    vertical: "entretenimiento",
    inicio: "2026-10-08T20:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Popular Melico Salazar",
    descripcion:
      "La exvocalista de Mecano regresa tras siete años con banda en vivo: éxitos de Mecano y de su carrera solista.",
    artista: "Ana Torroja",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9431",
  },
  {
    slug: "osn-ix-temporada-2026",
    title: "IX Concierto de Temporada — Sinfónica Nacional",
    vertical: "cultura",
    inicio: "2026-10-09T12:00:00-06:00",
    fin: "2026-10-11T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Dirigido por Carl St.Clair, con el barítono José Arturo Chacón y el pianista Manuel Matarrita: Mozart, Beethoven y el Réquiem de Fauré.",
    organizador: "Centro Nacional de la Música",
    precioDesde: "Desde ₡2.220",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "beele-borondo-tour",
    title: "Beéle — Borondo Tour",
    vertical: "entretenimiento",
    inicio: "2026-10-17T18:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "El colombiano Beéle vuelve a Costa Rica con su gira Borondo: «Morena», «Frente al mar» y «Santorini» en vivo.",
    artista: "Beéle",
    organizador: "HBarboza Producciones",
    precioDesde: "Desde $60",
    enlace: "https://www.kuikpei.com",
  },
  {
    slug: "piazzolla-le-grand-tango",
    title: "Astor Piazzolla Quinteto — Le Grand Tango",
    vertical: "cultura",
    inicio: "2026-10-23T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "El Quinteto Astor Piazzolla presenta su espectáculo de tango «Le Grand Tango» en el Teatro Nacional.",
    enlace: "https://www.eticket.cr/eventos.aspx?idlugar=462",
  },
  {
    slug: "def-leppard-extreme",
    title: "Def Leppard + Extreme",
    vertical: "entretenimiento",
    inicio: "2026-10-27T18:30:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Primera visita de Def Leppard a Costa Rica, con Extreme como invitado especial.",
    artista: "Def Leppard",
    organizador: "Move Concerts",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9400",
  },
  {
    slug: "osn-x-temporada-2026",
    title: "X Concierto de Temporada — Sinfónica Nacional",
    vertical: "cultura",
    inicio: "2026-10-30T12:00:00-06:00",
    fin: "2026-11-01T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Concierto de temporada con la Sinfonía n.º 41 «Júpiter» de Mozart en el programa.",
    organizador: "Centro Nacional de la Música",
    precioDesde: "Desde ₡2.220",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "dia-mascarada-2026",
    title: "Día Nacional de la Mascarada",
    vertical: "cultura",
    inicio: "2026-10-31T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Barva, Escazú, Aserrí y otros cantones",
    descripcion:
      "Celebración de la mascarada tradicional, símbolo nacional: pasacalles, cimarronas, exhibición de máscaras y comidas típicas en varios cantones.",
    precioDesde: "Entrada gratuita",
  },
  {
    slug: "trueno-parque-viva",
    title: "Trueno",
    vertical: "entretenimiento",
    inicio: "2026-11-01T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "El rapero argentino Trueno trae su gira internacional a Parque Viva.",
    artista: "Trueno",
    organizador: "GoTime",
    enlace: "https://www.eventcr.com/eventPage.php?id=288",
  },
  {
    slug: "alejandro-sanz-2026",
    title: "Alejandro Sanz — ¿Y Ahora Qué? Tour",
    vertical: "entretenimiento",
    inicio: "2026-11-07T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "Alejandro Sanz vuelve a Costa Rica con su gira «¿Y Ahora Qué?».",
    artista: "Alejandro Sanz",
    organizador: "Primo Entertainment",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9370",
  },
  {
    slug: "percance-20-anos",
    title: "Percance — 20 Años",
    vertical: "entretenimiento",
    inicio: "2026-11-07T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "CIC ANDE, San Antonio de Belén",
    descripcion:
      "La banda nacional celebra 20 años con un concierto extendido, invitados especiales y aforo de 2.500 personas.",
    artista: "Percance",
    precioDesde: "Desde ₡28.800",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9342",
  },
  {
    slug: "osn-xi-temporada-2026",
    title: "XI Concierto de Temporada — Sinfónica Nacional",
    vertical: "cultura",
    inicio: "2026-11-13T12:00:00-06:00",
    fin: "2026-11-15T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Penúltimo concierto de la Temporada Oficial 2026, dedicada a las playas costarricenses.",
    organizador: "Centro Nacional de la Música",
    precioDesde: "Desde ₡2.220",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "gorillaz-the-mountain-tour",
    title: "Gorillaz — The Mountain Tour",
    vertical: "entretenimiento",
    inicio: "2026-11-14T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "Primer concierto de Gorillaz en Costa Rica y única parada en Centroamérica de su gira The Mountain Tour. Mayores de 12 años; la mayoría de localidades, casi agotadas.",
    artista: "Gorillaz",
    organizador: "JOGO Latam",
    precioDesde: "Desde ₡38.000",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9501",
  },
  {
    slug: "carlos-rivera-vida-tour",
    title: "Carlos Rivera — Vida México Tour",
    vertical: "entretenimiento",
    inicio: "2026-11-14T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Estadio Nacional",
    descripcion:
      "El mexicano Carlos Rivera regresa con su gira «Vida México»: «Recuérdame», «Te esperaba» y más.",
    artista: "Carlos Rivera",
    precioDesde: "Desde ₡25.000",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9367",
  },
  {
    slug: "ca7riel-paco-amoroso-2026",
    title: "Ca7riel & Paco Amoroso — Free Spirits",
    vertical: "entretenimiento",
    inicio: "2026-11-15T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "El dúo argentino vuelve al país con su Free Spirits World Tour. Solo mayores de 18 años.",
    artista: "Ca7riel & Paco Amoroso",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9374",
  },
  {
    slug: "eros-ramazzotti-2026",
    title: "Eros Ramazzotti — Una Storia Importante",
    vertical: "entretenimiento",
    inicio: "2026-11-18T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Estadio Nacional",
    descripcion:
      "El italiano incluye a Costa Rica en su gira mundial, con éxitos de más de cuatro décadas.",
    artista: "Eros Ramazzotti",
    organizador: "Move Concerts",
    precioDesde: "Desde ₡33.000",
    enlace: "https://www.eticket.cr/eventos.aspx?idartista=1284",
  },
  {
    slug: "fabulosos-cadillacs-2026",
    title: "Los Fabulosos Cadillacs",
    vertical: "entretenimiento",
    inicio: "2026-11-19T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "La banda argentina de ska-rock regresa a Costa Rica: «Matador» y sus clásicos de vuelta en vivo. Solo mayores de 18 años.",
    artista: "Los Fabulosos Cadillacs",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9450",
  },
  {
    slug: "art-city-tour-noviembre",
    title: "Art City Tour — Cierre 2026",
    vertical: "cultura",
    inicio: "2026-11-20T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Museos y galerías del centro de San José",
    descripcion:
      "Circuito gratuito de museos, galerías y edificios patrimoniales con buses entre sedes; última edición del año. Registro previo con cupo limitado.",
    organizador: "GAM Cultural",
    precioDesde: "Entrada gratuita",
    enlace: "https://artcitytour.gamcultural.com/",
  },
  {
    slug: "milo-j-2026",
    title: "Milo J — La Vida Era Más Corta Tour",
    vertical: "entretenimiento",
    inicio: "2026-11-22T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Viva",
    descripcion:
      "Primera visita del argentino Milo J a Costa Rica. Mayores de 12 años (menores de 18 con adulto).",
    artista: "Milo J",
    organizador: "JOGO Latam",
    precioDesde: "Desde ₡28.673",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9510",
  },
  {
    slug: "martin-garrix-2026",
    title: "Martin Garrix — Americas Tour",
    vertical: "entretenimiento",
    // Hora en conflicto entre fuentes (7 vs 10 pm): entra por confirmar.
    inicio: "2026-11-27T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Parque Viva",
    descripcion:
      "Primera visita de Martin Garrix a Costa Rica con show de producción completa, dentro de su Americas Tour de 16 ciudades.",
    artista: "Martin Garrix",
    precioDesde: "Desde $54",
    enlace: "https://www.smartticket.fun/es/event/martin-garrix-en-costarica",
  },
  {
    slug: "osn-xii-temporada-2026",
    title: "XII Concierto de Temporada — Sinfónica Nacional",
    vertical: "cultura",
    inicio: "2026-11-27T12:00:00-06:00",
    fin: "2026-11-29T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Concierto de clausura de la Temporada Oficial 2026 de la Sinfónica Nacional.",
    organizador: "Centro Nacional de la Música",
    precioDesde: "Desde ₡2.220",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  {
    slug: "karol-g-tropitour",
    title: "Karol G — Tropitour",
    vertical: "entretenimiento",
    inicio: "2026-11-28T20:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Estadio Nacional",
    descripcion:
      "Karol G agotó su primera noche (viernes 27) en el Estadio Nacional y abrió esta segunda fecha dentro de su gira «Viajando por el Mundo Tropitour».",
    artista: "Karol G",
    organizador: "Move Concerts",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9381",
  },
  {
    slug: "feria-hecho-aqui-2026",
    title: "Feria Hecho Aquí",
    vertical: "experiencias",
    inicio: "2026-12-04T12:00:00-06:00",
    fin: "2026-12-06T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Antigua Aduana y Casa del Cuño",
    descripcion:
      "XII edición de la principal feria de artesanía, diseño y agroindustria hecha en Costa Rica; en 2026 estrena categoría de colectivos.",
    organizador: "Ministerio de Cultura y Juventud",
  },
  {
    slug: "cascanueces-2026",
    title: "Ballet El Cascanueces",
    vertical: "cultura",
    inicio: "2026-12-04T12:00:00-06:00",
    fin: "2026-12-13T23:59:00-06:00",
    horaPorConfirmar: true,
    lugar: "Teatro Nacional de Costa Rica",
    descripcion:
      "Temporada navideña anual de «El Cascanueces», con varios elencos y jóvenes talentos nacionales.",
    enlace: "https://boleteria.teatronacional.go.cr",
  },
  /* ── Ola 3 (hoja del equipo, 6 set 2026) ── */
  {
    // Ya pasó (5 set): entra como evento pasado — capta interés para la
    // próxima edición y habilita su cobertura.
    slug: "san-jose-diaspora-parade-2026",
    title: "San José Diaspora Parade",
    vertical: "cultura",
    inicio: "2026-09-05T10:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Parque Morazán y centro de San José",
    descripcion:
      "Desfile del Festival Flores de la Diáspora Africana: más de 40 agrupaciones artísticas —incluidas 12 bandas de Limón— del Morazán a la antigua Estación al Atlántico, con feria afrodescendiente y conciertos gratuitos.",
    organizador: "Festival Flores de la Diáspora Africana",
    precioDesde: "Entrada gratuita",
  },
  {
    slug: "whisky-fest-2026",
    title: "Whisky Fest",
    vertical: "gastronomia",
    inicio: "2026-09-12T12:00:00-06:00",
    horaPorConfirmar: true,
    lugar: "Campo Lago (Lindora)",
    descripcion:
      "Festival de whisky en Campo Lago: catas, marcas invitadas y gastronomía.",
    enlace: "https://atelierla.net/whisky-fest/",
  },
  {
    slug: "rawayana-2026",
    title: "Rawayana",
    vertical: "entretenimiento",
    inicio: "2026-12-12T19:00:00-06:00",
    horaPorConfirmar: false,
    lugar: "Anfiteatro de Parque Viva",
    descripcion:
      "La banda venezolana reprogramó para diciembre su show de junio (pospuesto en solidaridad con Venezuela tras los terremotos); las entradas compradas siguen siendo válidas.",
    artista: "Rawayana",
    enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9285",
  },
];

/**
 * Correcciones sobre eventos YA sembrados (investigación 18 ago 2026).
 * Solo toca campos puntuales de documentos agenda-2026-*; idempotente.
 */
const PARCHES: { id: string; set: Record<string, unknown>; nota: string }[] = [
  {
    // Prensa confirmó el show a las 9:00 p.m.
    id: "agenda-2026-cazzu-latinaje-tour",
    set: { inicio: "2026-09-19T21:00:00-06:00", horaPorConfirmar: false },
    nota: "Cazzu: hora confirmada 9:00 p.m.",
  },
  {
    // Ya existe la página directa del evento en eticket.
    id: "agenda-2026-lenny-tavarez-justin-quiles",
    set: { enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9426" },
    nota: "Lenny Tavárez & Justin Quiles: enlace directo de entradas.",
  },
];

/**
 * CANCELADO (prensa, ~12 ago): Jon Batiste canceló su concierto del 3 de
 * setiembre (reembolso automático). Se elimina el evento y la guía que el
 * robot le haya escrito, en borrador o publicada.
 */
const ELIMINAR: string[] = [
  "agenda-2026-jon-batiste-orquesta-filarmonica",
  "drafts.agenda-2026-jon-batiste-orquesta-filarmonica",
  "cronica-guia-agenda-2026-jon-batiste-orquesta-filarmonica",
  "drafts.cronica-guia-agenda-2026-jon-batiste-orquesta-filarmonica",
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

  // Correcciones puntuales sobre lo ya sembrado (solo si el doc existe).
  const actualizados: string[] = [];
  for (const p of PARCHES) {
    try {
      const existe = await db.fetch<string | null>(
        /* groq */ `*[_id == $id][0]._id`,
        { id: p.id }
      );
      if (!existe) continue;
      await db.patch(p.id).set(p.set).commit();
      actualizados.push(p.nota);
    } catch (err) {
      fallidos.push({
        evento: p.nota,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  // Cancelados: fuera el evento y su artículo (borrador o publicado).
  const eliminados: string[] = [];
  for (const id of ELIMINAR) {
    try {
      const existe = await db.fetch<string | null>(
        /* groq */ `*[_id == $id][0]._id`,
        { id }
      );
      if (!existe) continue;
      await db.delete(id);
      eliminados.push(id);
    } catch (err) {
      fallidos.push({
        evento: `eliminar ${id}`,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  if (creados.length > 0 || actualizados.length > 0 || eliminados.length > 0) {
    revalidatePath("/");
    revalidatePath("/agenda");
    // La página del evento cancelado debe dejar de servirse cacheada.
    revalidatePath("/agenda/jon-batiste-orquesta-filarmonica");
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    total: EVENTOS.length,
    creados,
    yaExistian,
    actualizados,
    eliminados,
    fallidos,
  });
}
