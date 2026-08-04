/**
 * Parche quirúrgico: agrega SOLO el campo `videoUrl` a los reels IG
 * sembrados, apuntando al reel REAL de Instagram. No toca miniaturas ni
 * ningún otro campo — las ediciones hechas en el Studio quedan intactas.
 * Idempotente: correrlo dos veces no cambia nada.
 *
 * Miss Grand y MEGACON no se parchan (salen de destacadas de IG sin URL
 * confirmada): pegá su enlace en el Studio → campo "Enlace del video".
 *
 * Uso:  npm run patch:reels
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
  console.error("✗ Falta SANITY_API_WRITE_TOKEN en .env.local");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2025-01-01", token, useCdn: false });

const URLS = {
  "seed-reel-ig-matcha-secreto":
    "https://www.instagram.com/sevive.la/reel/DbYxOWIAFWQ/",
  "seed-reel-ig-matchamuchacha-aniversario":
    "https://www.instagram.com/sevive.la/reel/DbYdyi5Ajes/",
  "seed-reel-ig-cosplay-comiccon-honduras":
    "https://www.instagram.com/sevive.la/reel/Dabnco1pcZg/",
  "seed-reel-ig-abelardo-sevivela":
    "https://www.instagram.com/sevive.la/reel/DabKCuiPlBx/",
};

console.log(`Parchando videoUrl de reels en ${projectId}/${dataset}…`);
let tx = client.transaction();
for (const [id, videoUrl] of Object.entries(URLS)) {
  // set() solo escribe este campo; miniaturas y demás no se tocan.
  tx = tx.patch(id, (p) => p.set({ videoUrl }));
}
try {
  await tx.commit();
  for (const [id, url] of Object.entries(URLS)) console.log(`  ✓ ${id} → ${url}`);
  console.log(
    "\n✔ Parche completo. Falta pegar en el Studio el enlace de:\n" +
      "  · seed-reel-ig-miss-grand-cr-backstage (destacada 'Miss Grand')\n" +
      "  · seed-reel-ig-megacon-en-un-minuto (destacada 'MEGACON')"
  );
} catch (err) {
  console.error("✗ El parche falló:", err.message || err);
  console.error("  (Si dice 'not found', ese reel no existe en Sanity — corré antes npm run seed:reels.)");
  process.exit(1);
}
