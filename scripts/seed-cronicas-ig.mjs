/**
 * Siembra de 5 CRÓNICAS demo basadas en el contenido REAL de Instagram (@sevive.la).
 *
 * Uso (necesita un token con permiso de escritura — "Editor" — en
 * sanity.io/manage → API → Tokens):
 *
 *   SANITY_API_WRITE_TOKEN=sk... node scripts/seed-cronicas-ig.mjs
 *
 * o, si tenés el token en .env.local (NEXT_PUBLIC_SANITY_PROJECT_ID, etc.):
 *
 *   node scripts/seed-cronicas-ig.mjs
 *
 * Idempotente: usa _id fijos (seed-cronica-ig-*) con createOrReplace, así que
 * se puede correr varias veces sin duplicar. NO toca el contenido del equipo
 * ni los eventos de la agenda.
 *
 * ⚠️ IMÁGENES: se usan imágenes-placeholder ya subidas (grado de color de la
 *    maqueta). Cada artículo indica en un comentario la URL de la publicación
 *    REAL de Instagram — reemplazá el placeholder por esa foto (que ustedes ya
 *    tienen y sobre la que tienen permisos) desde el Studio para que quede 100%
 *    auténtico.
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
      "  SANITY_API_WRITE_TOKEN=sk... node scripts/seed-cronicas-ig.mjs"
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

/* ── Imágenes-placeholder (mismas que la maqueta; reemplazar por la foto real de IG) ── */
const CDN =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3Gw4v501AXr5C77XvUBZkzv6kEb";
const IMAGES = {
  fair: `${CDN}/hf_20260801_045952_14583af5-ea3e-4837-8339-49a16b1e7fb5_min.webp`,
  food: `${CDN}/hf_20260801_045954_af905c89-90f3-41f3-a84f-d4d49b9b1ba7_min.webp`,
  street: `${CDN}/hf_20260801_050345_acb138f2-3255-47fc-8c35-9255c16b8117_min.webp`,
};

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
const key = () => `igc${(keyCounter++).toString(36).padStart(4, "0")}`;
const block = (text, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});

const DAY = 86400000;
const at = (days, hour = 9) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour + 6, 0, 0, 0); // hora CR ≈ UTC-6
  return d.toISOString();
};

async function run() {
  console.log(`Sembrando crónicas IG en ${projectId}/${dataset}…`);

  console.log("Imágenes:");
  const img = {};
  for (const [k, url] of Object.entries(IMAGES)) img[k] = await uploadImage(k, url);

  const docs = [
    /* 1 ─ Comic Con Honduras · fuente IG: instagram.com/sevive.la/p/DabRDwLmipA/ */
    {
      _id: "seed-cronica-ig-comiccon-honduras",
      _type: "cronica",
      title: "Comic Con Honduras: el día que el cosplay se robó el escenario",
      slug: { current: "comic-con-honduras-cosplay" },
      vertical: "entretenimiento",
      bajada:
        "Guerreros, heroínas y personajes salidos de la pantalla llenaron los pasillos. Estuvimos ahí para verlo de cerca.",
      autor: "Redacción SeViveLa",
      formato: "Cobertura",
      lecturaMin: 2,
      imagen: imageRef(img.fair, "Asistentes disfrazados en una convención de cultura pop"),
      cuerpo: [
        block("El talento del cosplay se vive en la Comic Con Honduras, y esta edición dejó el listón altísimo."),
        block(
          "Entre luces y música, los pasillos se llenaron de personajes que parecían haber saltado directo de la pantalla: armaduras armadas pieza por pieza, pelucas peinadas al detalle y maquillajes que tomaron horas frente al espejo. Detrás de cada disfraz hay semanas de trabajo, y se nota."
        ),
        block(
          "Pero la Comic Con no es solo mirar. Es comunidad. Es la persona que reconoce tu personaje al otro lado del pasillo, la foto improvisada, el grupo que se junta porque ama lo mismo. Esa es la energía que fuimos a buscar, y la encontramos en cada rincón del evento."
        ),
        block(
          "Desde SeViveLa seguimos de cerca la escena geek de la región, porque estos encuentros son de los que más mueven a la gente. Si te lo perdiste, deslizá por nuestro Instagram: guardamos a algunos de los mejores personajes de la jornada."
        ),
      ],
      fecha: at(-6, 9),
      esPortada: false,
      destacada: true,
    },

    /* 2 ─ MEGACON · destacada de IG (verificar detalles específicos antes de publicar) */
    {
      _id: "seed-cronica-ig-megacon",
      _type: "cronica",
      title: "MEGACON: la cultura pop se vive en grande",
      slug: { current: "megacon-cultura-pop" },
      vertical: "entretenimiento",
      bajada:
        "Cómics, gaming, coleccionables y cosplay bajo un mismo techo. Una parada obligada para la comunidad geek.",
      autor: "Redacción SeViveLa",
      formato: "Cobertura",
      lecturaMin: 2,
      imagen: imageRef(img.fair, "Feria de cultura pop con estands y público"),
      cuerpo: [
        block("Hay ferias que se visitan y ferias que se viven. MEGACON es de las segundas."),
        block(
          "Estands de coleccionables, torneos de gaming, artistas independientes vendiendo su trabajo, y una marea de cosplayers que convierten cada esquina en set de fotos: MEGACON reúne todo lo que la comunidad geek ama en un solo lugar. El plan no es entrar y salir, es quedarse a explorar."
        ),
        block(
          "Lo mejor de estos encuentros es que igualan a todo el mundo. El que llega disfrazado y el que llega en jeans comparten la misma emoción de encontrar esa figura que buscaban hace años o de conocer a alguien de su fandom."
        ),
        block(
          "En SeViveLa cubrimos estos eventos porque son cita fija para miles de personas. Seguinos para no perderte la próxima edición y todo lo que se mueve en la escena pop de la región."
        ),
      ],
      fecha: at(-9, 9),
      esPortada: false,
      destacada: false,
    },

    /* 3 ─ Celebration Fair @ Intercontinental · fuente IG: instagram.com/sevive.la/reel/DbYxOWIAFWQ/ */
    {
      _id: "seed-cronica-ig-celebration-fair",
      _type: "cronica",
      title: "La Celebration Fair se toma el Intercontinental",
      slug: { current: "celebration-fair-intercontinental" },
      vertical: "experiencias",
      bajada:
        "Marcas, sabores y experiencias en uno de los hoteles más emblemáticos del país. El plan del fin de semana tenía nombre propio.",
      autor: "Redacción SeViveLa",
      formato: "Cobertura",
      lecturaMin: 2,
      imagen: imageRef(img.fair, "Feria de experiencias en un hotel con estands iluminados"),
      cuerpo: [
        block("Se vive la Celebration Fair desde el Intercontinental Costa Rica, y vaya que se sintió."),
        block(
          "Durante la feria, los salones del hotel se convirtieron en una vitrina de marcas, emprendimientos y experiencias para todos los sentidos. De la degustación a la compra, de la charla al descubrimiento: el tipo de evento donde uno entra por un rato y termina quedándose toda la tarde."
        ),
        block(
          "El escenario ayudó. Pocos lugares reúnen la elegancia y la comodidad del Intercontinental, y eso elevó cada propuesta que se presentó. #ThePlaceToBe, como se leyó en redes ese día."
        ),
        block(
          "SeViveLa estuvo ahí, cámara en mano, para contarlo. Estos son los planes que nos gusta recomendar: los que combinan lugar, marca y experiencia en una sola visita."
        ),
      ],
      fecha: at(-6, 10),
      esPortada: false,
      destacada: true,
    },

    /* 4 ─ Matcha con MatchaMuchacha · fuente IG: instagram.com/sevive.la/reel/DbYxOWIAFWQ/ */
    {
      _id: "seed-cronica-ig-matcha-muchacha",
      _type: "cronica",
      title: "El secreto de un matcha perfecto, según MatchaMuchacha",
      slug: { current: "matcha-perfecto-matchamuchacha" },
      vertical: "gastronomia",
      bajada:
        "En la Celebration Fair encontramos a quienes convirtieron el matcha en un arte. Esto aprendimos.",
      autor: "Redacción SeViveLa",
      formato: "Cobertura",
      lecturaMin: 2,
      imagen: imageRef(img.food, "Bebida de matcha recién preparada"),
      cuerpo: [
        block("El secreto para un matcha perfecto es de esos que solo MatchaMuchacha nos puede dar."),
        block(
          "En plena Celebration Fair, su estación fue de las que hicieron fila. El matcha bueno no se improvisa: es cuestión de la calidad del polvo, la temperatura del agua, el batido justo hasta lograr esa espuma cremosa. Cada paso cuenta, y ellos lo tienen medido."
        ),
        block(
          "Más allá de la moda, el matcha se ganó su lugar en las mesas ticas. Y encontrarlo bien hecho —con ese equilibrio entre lo amargo y lo suave— es lo que separa una bebida cualquiera de una que uno quiere repetir."
        ),
        block(
          "Si sos del team matcha, seguí a MatchaMuchacha y no le pierdas la pista a las ferias donde montan su barra. En SeViveLa te avisamos dónde encontrarlos."
        ),
      ],
      fecha: at(-5, 11),
      esPortada: false,
      destacada: false,
    },

    /* 5 ─ Miss Grand Costa Rica · destacada de IG + agenda del sitio (verificar fecha/sede/nombres) */
    {
      _id: "seed-cronica-ig-miss-grand-cr",
      _type: "cronica",
      title: "Miss Grand Costa Rica: camino a la corona",
      slug: { current: "miss-grand-costa-rica" },
      vertical: "entretenimiento",
      bajada:
        "Belleza, escenario y causa. El certamen que reúne a las candidatas del país rumbo a la corona nacional.",
      autor: "Redacción SeViveLa",
      formato: "Cobertura",
      lecturaMin: 2,
      imagen: imageRef(img.street, "Escenario de un certamen de belleza iluminado"),
      cuerpo: [
        block("Miss Grand Costa Rica es de esos eventos que paran la conversación del país por una noche."),
        block(
          "Detrás de la pasarela hay meses de preparación: entrevistas, pruebas, proyección social y una agenda que exige tanto como cualquier competencia. Las candidatas no solo desfilan; representan a sus provincias y llevan una causa bajo el brazo, fiel al espíritu 'Stop the War and Violence' de la organización Miss Grand."
        ),
        block(
          "La final es puro espectáculo —luces, trajes, coreografía— pero lo que engancha es la historia de cada participante y el momento en que se anuncia quién llevará la banda al certamen internacional."
        ),
        block(
          "SeViveLa le sigue la pista al certamen de principio a fin. Mirá nuestra agenda para la fecha de la próxima gala y seguinos para conocer a las candidatas."
        ),
      ],
      fecha: at(-3, 9),
      esPortada: false,
      destacada: true,
    },
  ];

  console.log(`Documentos (${docs.length}):`);
  let tx = client.transaction();
  for (const doc of docs) tx = tx.createOrReplace(doc);
  await tx.commit();
  for (const doc of docs) console.log(`  ✓ ${doc._id}`);

  console.log("\n✔ Siembra de crónicas IG completa.");
}

run().catch((err) => {
  console.error("✗ La siembra falló:", err.message || err);
  process.exit(1);
});
