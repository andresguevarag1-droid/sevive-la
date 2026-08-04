/**
 * Siembra de 6 REELS demo (sección "En video") basados en el contenido REAL de
 * Instagram (@sevive.la).
 *
 * Uso (token con permiso de escritura — "Editor" — en sanity.io/manage → API → Tokens):
 *
 *   SANITY_API_WRITE_TOKEN=sk... node scripts/seed-reels-ig.mjs
 *   (o `node scripts/seed-reels-ig.mjs` si el token está en .env.local)
 *
 * Idempotente: usa _id fijos (seed-reel-ig-*) con createOrReplace → no duplica.
 * `orden` arranca en 7 para que estos reels caigan DESPUÉS de los 6 reels demo
 * genéricos que ya existen (`seed-reel-*`). Si querés que estos reemplacen a los
 * genéricos, borrá los `seed-reel-*` viejos desde el Studio.
 *
 * ⚠️ MINIATURAS: se usan imágenes-placeholder. Cada reel indica la URL de la
 *    publicación REAL de Instagram — reemplazá la miniatura por el frame real de
 *    ese reel desde el Studio (ustedes ya tienen el video y los permisos).
 *
 * 💡 Mejora futura (no requerida hoy): el frontend NO enlaza el reel a Instagram.
 *    Si se agrega un campo `enlace` al esquema `reel`, se puede apuntar cada
 *    tarjeta al reel real de IG (ver URLs abajo) y mejorar la retención.
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";

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
      "  SANITY_API_WRITE_TOKEN=sk... node scripts/seed-reels-ig.mjs"
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

/* ── Miniaturas-placeholder (reemplazar por el frame real del reel de IG) ── */
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

const DAY = 86400000;
const at = (days, hour = 12) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour + 6, 0, 0, 0); // hora CR ≈ UTC-6
  return d.toISOString();
};

async function run() {
  console.log(`Sembrando reels IG en ${projectId}/${dataset}…`);

  console.log("Imágenes:");
  const img = {};
  for (const [k, url] of Object.entries(IMAGES)) img[k] = await uploadImage(k, url);

  /* [slug, title, vertical, duracion, imgKey, orden, altMiniatura, fuenteIG] */
  const reels = [
    [
      "matcha-secreto",
      "El secreto de un matcha perfecto",
      "gastronomia",
      "0:41",
      "food",
      7,
      "Preparación de un matcha con espuma cremosa",
      "instagram.com/sevive.la/reel/DbYxOWIAFWQ/",
    ],
    [
      "matchamuchacha-aniversario",
      "MatchaMuchacha cumple un año: así fue la Celebration Fair",
      "experiencias",
      "1:03",
      "fair",
      8,
      "Feria de aniversario de MatchaMuchacha en el Intercontinental",
      "instagram.com/sevive.la/reel/DbYdyi5Ajes/ (Maite y Vale · @sofchavess · @intercontinentalcostarica)",
    ],
    [
      "cosplay-comiccon-honduras",
      "Los mejores cosplay de la Comic Con Honduras",
      "entretenimiento",
      "0:58",
      "fair",
      9,
      "Cosplayers en la Comic Con Honduras",
      "instagram.com/sevive.la/reel/Dabnco1pcZg/",
    ],
    [
      "abelardo-sevivela",
      "Abelardo Vargas le regala unas palabras a SeViveLa",
      "entretenimiento",
      "0:29",
      "street",
      10,
      "El presentador Abelardo Vargas frente a cámara",
      "instagram.com/sevive.la/reel/DabKCuiPlBx/",
    ],
    [
      "miss-grand-cr-backstage",
      "Miss Grand Costa Rica: tras bambalinas",
      "entretenimiento",
      "0:47",
      "street",
      11,
      "Backstage del certamen Miss Grand Costa Rica",
      "destacada 'Miss Grand' de IG · verificar frame",
    ],
    [
      "megacon-en-un-minuto",
      "MEGACON en un minuto",
      "entretenimiento",
      "1:12",
      "fair",
      12,
      "Recorrido por la convención MEGACON",
      "destacada 'MEGACON' de IG · verificar frame",
    ],
  ];

  /* URL del reel real (campo videoUrl → la tarjeta abre el video al tocar).
     Miss Grand y MEGACON salen de destacadas sin URL confirmada: pegar su
     enlace en el Studio → campo "Enlace del video". */
  const VIDEO_URLS = {
    "matcha-secreto": "https://www.instagram.com/sevive.la/reel/DbYxOWIAFWQ/",
    "matchamuchacha-aniversario": "https://www.instagram.com/sevive.la/reel/DbYdyi5Ajes/",
    "cosplay-comiccon-honduras": "https://www.instagram.com/sevive.la/reel/Dabnco1pcZg/",
    "abelardo-sevivela": "https://www.instagram.com/sevive.la/reel/DabKCuiPlBx/",
  };

  const docs = reels.map(
    ([slug, title, vertical, duracion, imgKey, orden, alt]) => ({
      _id: `seed-reel-ig-${slug}`,
      _type: "reel",
      title,
      vertical,
      miniatura: imageRef(img[imgKey], alt),
      duracion,
      fecha: at(-(orden - 6), 12),
      orden,
      ...(VIDEO_URLS[slug] ? { videoUrl: VIDEO_URLS[slug] } : {}),
    })
  );

  console.log(`Documentos (${docs.length}):`);
  let tx = client.transaction();
  for (const doc of docs) tx = tx.createOrReplace(doc);
  await tx.commit();
  for (const doc of docs) console.log(`  ✓ ${doc._id}`);

  console.log("\n✔ Siembra de reels IG completa.");
}

run().catch((err) => {
  console.error("✗ La siembra falló:", err.message || err);
  process.exit(1);
});
