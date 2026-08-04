/**
 * Retira el contenido de EJEMPLO de Sanity: crónicas ficticias, reels de
 * muestra, lugares de relleno y beneficios de demostración.
 *
 * NO toca: la campaña (participantes reales), los eventos reales de agenda,
 * la dinámica, ni NINGÚN documento creado por el equipo en el Studio.
 *
 * Uso:  npm run retirar:ejemplo
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

const EJEMPLO = [
  // Crónicas ficticias
  "seed-cronica-portada",
  "seed-cronica-escapadas",
  "seed-cronica-barrio-lienzo",
  "seed-cronica-casado",
  // Reels de muestra (sin video real)
  "seed-reel-sodas-cartago",
  "seed-reel-amanecer-poas",
  "seed-reel-festival-picnic",
  "seed-reel-murales-amon",
  "seed-reel-feria-zarcero",
  "seed-reel-brunch-escalante",
  // Lugares de relleno
  "seed-lugar-mercadito",
  "seed-lugar-amon",
  // Beneficios de demostración
  "seed-beneficio-ventana",
  "seed-beneficio-doka",
  "seed-beneficio-nosara",
];

console.log(`Retirando ${EJEMPLO.length} documentos de ejemplo en ${projectId}/${dataset}…`);
let tx = client.transaction();
for (const id of EJEMPLO) tx = tx.delete(id);
try {
  await tx.commit();
  for (const id of EJEMPLO) console.log(`  ✕ ${id}`);
  console.log(
    "\n✔ Contenido de ejemplo retirado. La campaña, los eventos reales y todo lo" +
      "\n  creado por el equipo en el Studio quedaron intactos."
  );
} catch (err) {
  console.error("✗ El retiro falló:", err.message || err);
  process.exit(1);
}
