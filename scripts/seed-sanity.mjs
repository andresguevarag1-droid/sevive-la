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

async function run() {
  console.log(`Sembrando en ${projectId}/${dataset}…`);

  console.log("Imágenes:");
  const img = {};
  for (const [k, url] of Object.entries(IMAGES)) {
    img[k] = await uploadImage(k, url);
  }

  const docs = [
    /* ── Crónicas: 1 portada + 3 destacadas ── */
    {
      _id: "seed-cronica-portada",
      _type: "cronica",
      title: "La ciudad se come en la calle",
      slug: { current: "la-ciudad-se-come-en-la-calle" },
      vertical: "gastronomia",
      bajada:
        "Ferias nocturnas, sodas de barrio y cocineros que convirtieron el fin de semana en un plan. Una guía para comer bien sin reservación.",
      autor: "Redacción SeViveLa",
      formato: "Crónica",
      lecturaMin: 8,
      imagen: imageRef(img.fair, "Feria gastronómica nocturna con puestos iluminados"),
      cuerpo: [
        block("San José huele a plancha caliente los viernes por la noche.", "normal"),
        block(
          "De la feria de Zapote a los food trucks de Escalante, la escena callejera dejó de ser plan B: es el plan. Esta es la ruta que la redacción caminó, comió y aprobó."
        ),
      ],
      fecha: at(-1, 9),
      esPortada: true,
      destacada: false,
    },
    {
      _id: "seed-cronica-escapadas",
      _type: "cronica",
      title: "Cinco escapadas a menos de dos horas de San José",
      slug: { current: "cinco-escapadas-cerca-de-san-jose" },
      vertical: "turismo",
      bajada: "Playa, montaña y aguas termales para un fin de semana sin avión.",
      autor: "María José Rojas",
      formato: "Guía",
      lecturaMin: 6,
      imagen: imageRef(img.landscape, "Paisaje montañoso de Costa Rica al amanecer"),
      cuerpo: [block("A veces el mejor viaje es el que cabe en un tanque de gasolina.")],
      fecha: at(-2, 9),
      esPortada: false,
      destacada: true,
    },
    {
      _id: "seed-cronica-barrio-lienzo",
      _type: "cronica",
      title: "El barrio que se volvió lienzo",
      slug: { current: "el-barrio-que-se-volvio-lienzo" },
      vertical: "cultura",
      bajada: "Murales, cafés y una escena que reescribe el centro de la capital.",
      autor: "Daniel Vargas",
      formato: "Crónica",
      lecturaMin: 5,
      imagen: imageRef(img.street, "Calle urbana con murales de colores"),
      cuerpo: [block("Barrio Amón amaneció distinto: alguien pintó la esquina de la 7.")],
      fecha: at(-3, 9),
      esPortada: false,
      destacada: true,
    },
    {
      _id: "seed-cronica-casado",
      _type: "cronica",
      title: "En defensa del casado",
      slug: { current: "en-defensa-del-casado" },
      vertical: "gastronomia",
      bajada:
        "Por qué el plato más común del país es también el más difícil de hacer bien.",
      autor: "Redacción SeViveLa",
      formato: "Ensayo",
      lecturaMin: 4,
      imagen: imageRef(img.food, "Plato de comida típica costarricense"),
      cuerpo: [block("Un casado no se cocina: se compone.")],
      fecha: at(-4, 9),
      esPortada: false,
      destacada: true,
    },

    /* ── Eventos: 6, esta semana ── */
    {
      _id: "seed-evento-chicharron",
      _type: "evento",
      title: "Festival del Chicharrón",
      vertical: "gastronomia",
      inicio: at(2, 11),
      lugar: "Puriscal",
      descripcion: "La cita anual con el chicharrón: cocina en leña, música en vivo y feria de productores.",
      imagen: imageRef(img.food, "Chicharrones servidos en feria gastronómica"),
    },
    {
      _id: "seed-evento-sonambulo",
      _type: "evento",
      title: "Sonámbulo en vivo",
      vertical: "entretenimiento",
      inicio: at(3, 20),
      lugar: "Anfiteatro Coca-Cola",
      descripcion: "La psicotropical de Sonámbulo vuelve al anfiteatro con invitados.",
      imagen: imageRef(img.fair, "Concierto nocturno al aire libre"),
    },
    {
      _id: "seed-evento-museos",
      _type: "evento",
      title: "Noche de museos",
      vertical: "cultura",
      inicio: at(3, 18),
      lugar: "Barrio Amón",
      descripcion: "Museos abiertos hasta la medianoche, con recorridos guiados gratuitos.",
      imagen: imageRef(img.street, "Fachada de museo iluminada de noche"),
    },
    {
      _id: "seed-evento-flores",
      _type: "evento",
      title: "Feria de las Flores",
      vertical: "experiencias",
      inicio: at(4, 9),
      lugar: "Zarcero",
      descripcion: "Los jardines de Zarcero en su mejor semana del año.",
      imagen: imageRef(img.landscape, "Jardines y topiarios de Zarcero"),
    },
    {
      _id: "seed-evento-poas",
      _type: "evento",
      title: "Amanecer guiado",
      vertical: "turismo",
      inicio: at(5, 5),
      lugar: "Volcán Poás",
      descripcion: "Caminata guiada para ver salir el sol desde el mirador principal.",
      imagen: imageRef(img.landscape, "Cráter del volcán Poás al amanecer"),
    },
    {
      _id: "seed-evento-mercado",
      _type: "evento",
      title: "Mercado de diseño local",
      vertical: "estilo-de-vida",
      inicio: at(5, 10),
      lugar: "Barrio Escalante",
      descripcion: "Marcas independientes, vinilos, café y comida de autor.",
      imagen: imageRef(img.street, "Mercado urbano de diseño con puestos"),
    },

    /* ── Reels: 6 ── */
    ...[
      ["sodas-cartago", "Las mejores sodas de Cartago", "gastronomia", "1:04", "food", 1],
      ["amanecer-poas", "Amanecer en el Volcán Poás", "turismo", "0:48", "landscape", 2],
      ["festival-picnic", "Detrás del festival Picnic", "entretenimiento", "1:22", "fair", 3],
      ["murales-amon", "Ruta de murales en Barrio Amón", "cultura", "0:59", "street", 4],
      ["feria-zarcero", "Un sábado en la Feria de las Flores", "experiencias", "1:10", "landscape", 5],
      ["brunch-escalante", "Dónde hacer brunch en Escalante", "estilo-de-vida", "0:52", "food", 6],
    ].map(([slug, title, vertical, duracion, imgKey, orden]) => ({
      _id: `seed-reel-${slug}`,
      _type: "reel",
      title,
      vertical,
      miniatura: imageRef(img[imgKey], title),
      duracion,
      fecha: at(-orden, 12),
      orden,
    })),

    /* ── Beneficios: 3 ── */
    {
      _id: "seed-beneficio-ventana",
      _type: "beneficio",
      title: "Brunch de La Ventana",
      marca: "La Ventana",
      vertical: "gastronomia",
      detalle: "30% · código VIVELA30",
      vigencia: at(30, 12).slice(0, 10),
      patrocinado: true,
      orden: 1,
    },
    {
      _id: "seed-beneficio-doka",
      _type: "beneficio",
      title: "Tour de café Doka",
      marca: "Doka Estate",
      vertical: "experiencias",
      detalle: "2x1 entre semana",
      vigencia: at(45, 12).slice(0, 10),
      patrocinado: false,
      orden: 2,
    },
    {
      _id: "seed-beneficio-nosara",
      _type: "beneficio",
      title: "Noche en Nosara",
      marca: "Bodhi Tree",
      vertical: "turismo",
      detalle: "Gratis para suscriptores",
      vigencia: at(60, 12).slice(0, 10),
      patrocinado: true,
      orden: 3,
    },

    /* ── Lugares: 2 ── */
    {
      _id: "seed-lugar-mercadito",
      _type: "lugar",
      title: "Mercadito de Escalante",
      slug: { current: "mercadito-de-escalante" },
      vertical: "gastronomia",
      ubicacion: "Barrio Escalante, San José",
      descripcion: "Patio gastronómico con diez cocinas y barra central.",
      imagen: imageRef(img.food, "Patio gastronómico con mesas compartidas"),
    },
    {
      _id: "seed-lugar-amon",
      _type: "lugar",
      title: "Barrio Amón",
      slug: { current: "barrio-amon" },
      vertical: "cultura",
      ubicacion: "San José centro",
      descripcion: "Casas patrimoniales, galerías y la mejor caminata urbana de la capital.",
      imagen: imageRef(img.street, "Calle de Barrio Amón con casas históricas"),
    },

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
          "5. La persona ganadora se elegirá al azar entre las participaciones válidas recibidas dentro del período de la dinámica, y será contactada por correo electrónico. Si no responde en 5 días hábiles, o no cumple los requisitos de elegibilidad, se elegirá una nueva persona ganadora."
        ),
        block(
          "6. El premio no es canjeable por dinero ni transferible. Gestión migratoria (pasaporte y visa) a cargo de la persona ganadora."
        ),
        block(
          "7. Los datos personales se tratan conforme a la Ley 8968 y la Política de Privacidad de SeViveLa; podés solicitar su eliminación en cualquier momento escribiendo a hola@sevive.la."
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

  console.log(`Documentos (${docs.length}):`);
  let tx = client.transaction();
  for (const doc of docs) tx = tx.createOrReplace(doc);
  await tx.commit();
  for (const doc of docs) console.log(`  ✓ ${doc._id}`);

  console.log("\n✔ Siembra completa. Revisá el contenido en /studio y la home.");
}

run().catch((err) => {
  console.error("✗ La siembra falló:", err.message || err);
  process.exit(1);
});
