/**
 * Siembra de contenido de ejemplo en Sanity (T1 del backlog).
 *
 * Uso (necesita un token con permiso de escritura, creado en
 * sanity.io/manage → API → Tokens → "Editor"):
 *
 *   SANITY_API_WRITE_TOKEN=sk... npm run seed
 *
 * Idempotente: usa _id fijos (seed-*) con createOrReplace, así que puede
 * correrse varias veces sin duplicar. El contenido real del equipo (creado
 * desde el Studio) no se toca. Las imágenes se suben una sola vez.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";

/* ── Cargar .env.local si existe (sin dependencias) ── */
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "srgf579x";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!token) {
  console.error(
    "✗ Falta SANITY_API_WRITE_TOKEN.\n" +
      "  Creá un token Editor en sanity.io/manage → API → Tokens y corré:\n" +
      "  SANITY_API_WRITE_TOKEN=sk... npm run seed"
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

/* ── Imágenes documentales de la maqueta (mismo grado de color) ── */
const CDN =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3Gw4v501AXr5C77XvUBZkzv6kEb";
const IMAGES = {
  fair: `${CDN}/hf_20260801_045952_14583af5-ea3e-4837-8339-49a16b1e7fb5_min.webp`,
  food: `${CDN}/hf_20260801_045954_af905c89-90f3-41f3-a84f-d4d49b9b1ba7_min.webp`,
  landscape: `${CDN}/hf_20260801_045956_66ede2b3-2f64-4cb6-8d18-e5523a6370e6_min.webp`,
  street: `${CDN}/hf_20260801_050345_acb138f2-3255-47fc-8c35-9255c16b8117_min.webp`,
};

/** Sube una imagen (o reutiliza el asset si ya se subió con ese nombre). */
async function uploadImage(key, url) {
  const filename = `seed-${key}.webp`;
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`,
    { filename }
  );
  if (existing) {
    console.log(`  · imagen ${filename} ya existe`);
    return existing;
  }
  console.log(`  ↑ subiendo ${filename}…`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

const imageRef = (assetId, alt) => ({
  _type: "image",
  asset: { _type: "reference", _ref: assetId },
  alt,
});

/* ── Helpers de Portable Text y fechas ── */
let keyCounter = 0;
const key = () => `seed${(keyCounter++).toString(36).padStart(4, "0")}`;
const block = (text, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});

const DAY = 86400000;
/** Fecha a N días de hoy, a la hora dada (aproximada, en UTC). */
const at = (days, hour = 18) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour + 6, 0, 0, 0); // hora CR ≈ UTC-6
  return d.toISOString();
};
/** Fecha fija "YYYY-MM-DD" a la hora CR dada (por defecto mediodía). */
const el = (ymd, hourCR = 12, minCR = 0) => {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  // hora CR = UTC-6; setUTCHours rueda al día siguiente cuando pasa de 24
  d.setUTCHours(hourCR + 6, minCR, 0, 0);
  return d.toISOString();
};

async function run() {
  console.log(`Sembrando en ${projectId}/${dataset}…`);

  console.log("Imágenes:");
  const img = {};
  for (const [k, url] of Object.entries(IMAGES)) {
    img[k] = await uploadImage(k, url);
  }

  const docs = [
    /* ── Agenda real de agosto 2026 (fechas y horas verificadas en fuentes
          públicas; donde no hay hora oficial: horaPorConfirmar=true.
          Sin inventar precios: precioDesde solo con dato verificado) ── */
    ...[
      {
        id: "arjona-seco-tour",
        artista: "Ricardo Arjona",
        title: "Ricardo Arjona — Seco Tour",
        vertical: "entretenimiento",
        inicio: el("2026-08-14", 19),
        fin: el("2026-08-15", 22),
        horaConfirmada: true,
        lugar: "Estadio Nacional, La Sabana",
        descripcion: "La gira 'Seco Tour' del cantautor guatemalteco, con dos fechas en San José.",
        cuerpo: [
          "Dos funciones: viernes 14 y sábado 15 de agosto, ambas a las 7:00 p.m. La segunda fecha se abrió tras agotarse la primera.",
        ],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9175",
      },
      {
        id: "romeo-santos-prince-royce",
        artista: "Romeo Santos y Prince Royce",
        title: "Romeo Santos & Prince Royce",
        vertical: "entretenimiento",
        inicio: el("2026-08-18", 19),
        horaConfirmada: true,
        lugar: "Estadio Nacional, La Sabana",
        descripcion: "Gira conjunta 'Mejor Tarde Que Nunca Tour 2026': una noche entera de bachata.",
        cuerpo: ["Martes 18 de agosto, 7:00 p.m., en el Estadio Nacional."],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9321",
        precioDesde: "Desde ₡41.700",
      },
      {
        id: "yandel-sinfonico",
        artista: "Yandel",
        title: "Yandel Sinfónico",
        vertical: "entretenimiento",
        inicio: el("2026-08-30", 19),
        horaConfirmada: true,
        lugar: "Parque Viva, Alajuela",
        descripcion: "Los éxitos de Yandel reinterpretados con orquesta. Apto para mayores de 12 años.",
        cuerpo: [
          "Domingo 30 de agosto, 7:00 p.m. Yandel repasa su carrera acompañado por una orquesta sinfónica. Evento para mayores de 12 años.",
        ],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9429",
      },
      {
        id: "greeicy-candela",
        artista: "Greeicy",
        title: "Greeicy — Candela World Tour",
        vertical: "entretenimiento",
        inicio: el("2026-08-29", 19),
        horaConfirmada: true,
        lugar: "Centro de Eventos Pedregal, Belén",
        descripcion: "La gira mundial 'Candela' de la artista colombiana: pop y urbano.",
        cuerpo: ["Sábado 29 de agosto, 7:00 p.m., en el Centro de Eventos Pedregal."],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9419",
      },
      {
        id: "expovino",
        title: "EXPOVINO",
        vertical: "gastronomia",
        inicio: el("2026-08-28", 15),
        fin: el("2026-08-29", 21),
        horaConfirmada: true,
        lugar: "Centro de Convenciones de Costa Rica",
        descripcion: "La feria del vino: más de 500 bodegas, catas y maridajes. Viernes y sábado de 3 a 9 p.m.",
        cuerpo: [
          "Viernes 28 y sábado 29 de agosto, de 3:00 p.m. a 9:00 p.m. (jueves 27 exclusivo para compradores profesionales, de 2:00 a 8:00 p.m.).",
          "La entrada incluye una copa para recorrer libremente más de 500 bodegas representadas por más de 25 distribuidores e importadores.",
        ],
        enlace: "https://expovinocr.com",
      },
      {
        id: "ballet-gala-fragmentos",
        title: "Ballet Nacional — Gala Fragmentos",
        vertical: "cultura",
        inicio: el("2026-08-29", 19),
        horaConfirmada: true,
        lugar: "Teatro Melico Salazar",
        descripcion: "Fragmentos de 'El lago de los cisnes', 'Don Quijote' y 'El corsario', con bailarines invitados del American Ballet Theatre.",
        cuerpo: [
          "Sábado 29 de agosto, 7:00 p.m., en el marco del Festival Internacional de Ballet en el Teatro Popular Melico Salazar.",
        ],
        enlace: "https://tiquetshow.cr",
      },
      {
        id: "osn-vii-concierto",
        title: "Orquesta Sinfónica Nacional — VII Concierto de Temporada",
        vertical: "cultura",
        inicio: el("2026-08-21"),
        fin: el("2026-08-23", 13),
        lugar: "Teatro Nacional",
        descripcion: "La temporada oficial 2026 de la OSN, dedicada a las playas de Costa Rica.",
        cuerpo: [
          "Funciones el viernes 21 y el domingo 23 de agosto en el Teatro Nacional. Horarios en la boletería oficial.",
        ],
        enlace: "https://www.teatronacional.go.cr",
        organizador: "Orquesta Sinfónica Nacional",
        precioDesde: "Desde ₡2.200",
      },
      {
        id: "mujercitas-teatro",
        title: "Mujercitas",
        vertical: "cultura",
        inicio: el("2026-08-08"),
        fin: el("2026-08-09", 21),
        lugar: "Teatro Nacional",
        descripcion: "La adaptación teatral del clásico de Louisa May Alcott, en nueva temporada.",
        cuerpo: [
          "Las aventuras de las hermanas March en el escenario del Teatro Nacional. Funciones el fin de semana del 8 y 9 de agosto; horarios en la boletería oficial.",
        ],
        enlace: "https://boleteria.teatronacional.go.cr",
      },
      {
        id: "musica-inclusiva-sifais",
        title: "Música Inclusiva en Concierto — SIFAIS",
        vertical: "entretenimiento",
        inicio: el("2026-08-13", 19, 30),
        horaConfirmada: true,
        lugar: "Anfiteatro Coca-Cola, Parque Viva",
        descripcion: "Concierto benéfico por los 15 años de SIFAIS con Debi Nova, Gandhi, Malpaís y 150 músicos de La Carpio.",
        cuerpo: [
          "Jueves 13 de agosto, 7:30 p.m. Debi Nova, Gandhi y Malpaís comparten escenario por primera vez, junto a 150 músicos formados en los programas de la Fundación SIFAIS y la banda Balance.",
          "Lo recaudado apoya la educación musical en comunidades en riesgo social.",
        ],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9467",
        organizador: "Fundación SIFAIS",
      },
      {
        id: "blessd-parque-viva",
        artista: "Blessd",
        title: "BLESSD",
        vertical: "entretenimiento",
        inicio: el("2026-08-08", 19),
        horaConfirmada: true,
        lugar: "Parque Viva, Alajuela",
        descripcion: "El artista urbano colombiano llega con su reggaetón y trap. Para mayores de 15 años.",
        cuerpo: ["Sábado 8 de agosto, 7:00 p.m. Evento para mayores de 15 años."],
        enlace: "https://www.eticket.cr/masinformacion.aspx?idevento=9366",
      },
      {
        id: "safe-and-sound",
        title: "Safe & Sound",
        vertical: "entretenimiento",
        inicio: el("2026-08-08"),
        lugar: "Hotel Intercontinental",
        descripcion: "Evento de música y experiencia. Detalles por confirmar con el organizador.",
      },
      {
        id: "final-miss-grand",
        title: "Final Miss Grand Costa Rica",
        vertical: "entretenimiento",
        inicio: el("2026-08-12"),
        lugar: "Auditorio Nacional, Museo de los Niños",
        descripcion: "La noche final del certamen nacional.",
      },
      {
        id: "lanzamiento-sira",
        title: "Lanzamiento de colección SIRA",
        vertical: "estilo-de-vida",
        inicio: el("2026-08-01"),
        lugar: "Tienda Octavia",
        descripcion: "Lanzamiento de la nueva colección de la marca SIRA.",
      },
      {
        id: "hilos-de-identidad",
        title: "Hilos de identidad — trajes limonenses",
        vertical: "cultura",
        inicio: el("2026-08-04"),
        lugar: "Biblioteca Nacional",
        descripcion: "Exhibición cultural de trajes tradicionales de Limón.",
      },
      {
        id: "jugo-de-pina-monge",
        title: "Jugo de Piña — Julián Monge",
        vertical: "cultura",
        inicio: el("2026-08-03"),
        fin: el("2026-08-31", 17),
        lugar: "Biblioteca Nacional",
        descripcion: "Exposición de arte de Julián Monge, todo el mes de agosto.",
      },
    ].map((e) => ({
      _id: `seed-evento-${e.id}`,
      _type: "evento",
      title: e.title,
      slug: { current: e.id },
      vertical: e.vertical,
      inicio: e.inicio,
      ...(e.fin ? { fin: e.fin } : {}),
      horaPorConfirmar: !e.horaConfirmada,
      lugar: e.lugar,
      descripcion: e.descripcion,
      cuerpo: [
        ...(e.cuerpo ?? [e.descripcion]).map((t) => block(t)),
        ...(e.horaConfirmada
          ? []
          : [block("Horario exacto y condiciones: confirmar con el organizador o en el punto de venta oficial.")]),
      ],
      ...(e.enlace ? { enlace: e.enlace } : {}),
      ...(e.precioDesde ? { precioDesde: e.precioDesde } : {}),
      ...(e.organizador ? { organizador: e.organizador } : {}),
      ...(e.artista ? { artista: e.artista } : {}),
    })),

    /* ── Campaña Latin Grammys 2026 (hero de home + landing de captura) ── */
    {
      _id: "seed-campana-latin-grammys",
      _type: "campana",
      titulo: "Ponemos los Latin Grammys a tus pies",
      subtitulo: "Ganate un viaje a los Latin Grammys 2026 en Las Vegas.",
      slug: { current: "latin-grammys" },
      activa: true,
      vertical: "entretenimiento",
      ctaTexto: "Participá gratis",
      microcopy: "Válido solo para Costa Rica · Participar no cuesta nada",
      inicia: at(-1, 8),
      termina: at(70, 21),
      premio:
        "Un viaje a la 27.ª entrega de los Latin Grammys 2026 en Las Vegas, Nevada.",
      patrocinado: false,
      referidosActivos: true,
      chancesMaxPorReferido: 10,
      bases: [
        block("Bases y condiciones — Dinámica Latin Grammys 2026", "h2"),
        block(
          "1. Organiza SeViveLa. Pueden participar personas mayores de 21 años, residentes en Costa Rica, con pasaporte y visa americana vigentes al momento del viaje."
        ),
        block(
          "2. La participación es gratuita: no se exige compra ni pago alguno. Se permite una participación por persona (por correo electrónico)."
        ),
        block(
          "3. Para participar hay que completar el formulario en sevive.la con nombre completo, correo, provincia de residencia y las respuestas de elegibilidad, aceptando el tratamiento de datos y estas bases."
        ),
        block(
          "4. Premio: un viaje para asistir a la 27.ª entrega anual de los Latin Grammy en Las Vegas, Nevada (fecha del evento por confirmar con la fuente oficial de la Latin Recording Academy; referencia: 12 de noviembre de 2026). El detalle de boletos, vuelos, hospedaje y viáticos incluidos se especificará antes del cierre de la dinámica."
        ),
        block(
          "5. Referidos: cada participante recibe un enlace personal. Por cada persona distinta que participe válidamente con ese enlace, el participante suma una (1) oportunidad adicional en el sorteo, hasta un máximo de diez (10) oportunidades adicionales. No cuentan los auto-referidos ni las participaciones duplicadas o fraudulentas, que podrán invalidarse. Participar y referir es siempre gratuito."
        ),
        block(
          "6. La persona ganadora se elegirá al azar entre las participaciones válidas recibidas dentro del período de la dinámica, ponderando las oportunidades de cada participante (base más referidos válidos). El método y la semilla del sorteo quedarán registrados para su auditoría. Será contactada por correo electrónico; si no responde en 5 días hábiles, o no cumple los requisitos de elegibilidad, se elegirá una nueva persona ganadora."
        ),
        block(
          "7. El premio no es canjeable por dinero ni transferible. Gestión migratoria (pasaporte y visa) a cargo de la persona ganadora."
        ),
        block(
          "8. Los datos personales se tratan conforme a la Ley 8968 y la Política de Privacidad de SeViveLa; podés solicitar su eliminación en cualquier momento escribiendo a hola@sevive.la."
        ),
      ],
    },

    /* ── Dinámica: 1, abierta 14 días ── */
    {
      _id: "seed-dinamica-cena-ventana",
      _type: "dinamica",
      title: "Ganate una cena para dos en La Ventana",
      slug: { current: "cena-la-ventana" },
      vertical: "gastronomia",
      premio: "Cena completa para dos personas (entrada, plato fuerte, postre y maridaje).",
      descripcion: [
        block("La Ventana y SeViveLa te invitan a cenar."),
        block(
          "Participá gratis dejando tus datos y contándonos con quién irías. La persona ganadora se elige al azar entre todas las participaciones válidas y se anuncia en nuestras redes."
        ),
      ],
      imagen: imageRef(img.food, "Mesa servida para dos en restaurante"),
      inicio: at(-1, 8),
      cierre: at(14, 21),
      pregunta: "¿Con quién irías y qué celebrarían?",
      marca: "La Ventana",
      patrocinado: true,
      bases: [
        block("Bases de la dinámica", "h2"),
        block(
          "1. Organiza SeViveLa en alianza con La Ventana. Pueden participar personas mayores de 18 años residentes en Costa Rica."
        ),
        block(
          "2. La participación es gratuita: no se exige compra ni pago alguno. Se permite una participación por persona."
        ),
        block(
          "3. Para participar hay que completar el formulario con nombre, correo y aceptar el tratamiento de datos según la Política de Privacidad."
        ),
        block(
          "4. La persona ganadora se elegirá al azar entre las participaciones válidas dentro del plazo, y será contactada por correo. Si no responde en 5 días hábiles, se elegirá una nueva."
        ),
        block(
          "5. El premio consiste en una cena para dos personas en La Ventana. No es canjeable por dinero. Reservación sujeta a disponibilidad."
        ),
        block(
          "6. Los datos de las personas participantes se tratan conforme a la Ley 8968; podés solicitar su eliminación en cualquier momento."
        ),
      ],
    },
  ];

  // La campaña la edita el equipo en el Studio (arte, fechas, bases):
  // si ya existe, solo se crean campos nuevos que falten — NUNCA se pisa.
  const idsCampana = docs.filter((d) => d._type === "campana").map((d) => d._id);
  const campanasExistentes = idsCampana.length
    ? await client.fetch(`*[_id in $ids]._id`, { ids: idsCampana })
    : [];

  // Eventos demo retirados (tenían fechas inventadas/rodantes): si quedaron
  // de siembras anteriores, se eliminan. Borrar un id inexistente no falla.
  const RETIRADOS = [
    // Contenido de ejemplo retirado del proyecto (no se resiembra):
    "seed-cronica-portada",
    "seed-cronica-escapadas",
    "seed-cronica-barrio-lienzo",
    "seed-cronica-casado",
    "seed-reel-sodas-cartago",
    "seed-reel-amanecer-poas",
    "seed-reel-festival-picnic",
    "seed-reel-murales-amon",
    "seed-reel-feria-zarcero",
    "seed-reel-brunch-escalante",
    "seed-lugar-mercadito",
    "seed-lugar-amon",
    "seed-beneficio-ventana",
    "seed-beneficio-doka",
    "seed-beneficio-nosara",
    // Eventos demo con fechas inventadas (retirados antes):
    "seed-evento-chicharron",
    "seed-evento-sonambulo",
    "seed-evento-museos",
    "seed-evento-flores",
    "seed-evento-poas",
    "seed-evento-mercado",
  ];

  console.log(`Documentos (${docs.length}):`);
  let tx = client.transaction();
  for (const id of RETIRADOS) tx = tx.delete(id);
  for (const doc of docs) {
    if (doc._type === "campana" && campanasExistentes.includes(doc._id)) {
      // Solo completar campos que no existan (setIfMissing) — respeta el Studio.
      tx = tx.patch(doc._id, (p) =>
        p.setIfMissing({
          referidosActivos: doc.referidosActivos,
          chancesMaxPorReferido: doc.chancesMaxPorReferido,
        })
      );
    } else {
      tx = tx.createOrReplace(doc);
    }
  }
  await tx.commit();
  console.log(`  ✕ eventos demo eliminados (${RETIRADOS.length}): fechas no verificadas`);
  for (const doc of docs) {
    const preservada =
      doc._type === "campana" && campanasExistentes.includes(doc._id);
    console.log(`  ${preservada ? "· (existente, sin pisar)" : "✓"} ${doc._id}`);
  }

  console.log("\n✔ Siembra completa. Revisá el contenido en /studio y la home.");
}

run().catch((err) => {
  console.error("✗ La siembra falló:", err.message || err);
  process.exit(1);
});
