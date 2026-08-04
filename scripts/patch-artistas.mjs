/**
 * Parche quirúrgico: agrega SOLO el campo `artista` a los 5 conciertos
 * sembrados. No toca ningún otro campo ni documento — las ediciones hechas
 * en el Studio quedan intactas. Idempotente: correrlo dos veces no cambia nada.
 *
 * Uso:  npm run patch:artistas
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

const ARTISTAS = {
  "seed-evento-arjona-seco-tour": "Ricardo Arjona",
  "seed-evento-romeo-santos-prince-royce": "Romeo Santos y Prince Royce",
  "seed-evento-yandel-sinfonico": "Yandel",
  "seed-evento-greeicy-candela": "Greeicy",
  "seed-evento-blessd-parque-viva": "Blessd",
};

console.log(`Parchando artistas en ${projectId}/${dataset}…`);
let tx = client.transaction();
for (const [id, artista] of Object.entries(ARTISTAS)) {
  // set() solo escribe este campo; el resto del documento no se toca.
  tx = tx.patch(id, (p) => p.set({ artista }));
}
try {
  await tx.commit();
  for (const [id, artista] of Object.entries(ARTISTAS)) {
    console.log(`  ✓ ${id} → ${artista}`);
  }
  console.log("\n✔ Parche completo. Nada más fue modificado.");
} catch (err) {
  console.error("✗ El parche falló:", err.message || err);
  console.error("  (Si dice 'not found', ese evento no existe en Sanity — no pasa nada.)");
  process.exit(1);
}
