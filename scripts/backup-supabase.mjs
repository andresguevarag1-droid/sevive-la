/**
 * Respaldo de Supabase (O5): exporta todas las tablas de datos a JSON en
 * ./backups/<fecha>/ — para correr en tu máquina cuando quieras (o antes
 * de cambios grandes). NO sube nada a ningún lado: los archivos quedan
 * locales y backups/ está fuera del repo (.gitignore).
 *
 * Uso:  npm run backup
 * Necesita en .env.local: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const TABLAS = [
  "people",
  "person_interests",
  "consents",
  "dynamics",
  "entries",
  "events",
  "campaign_entries",
  "coupons",
  "venues",
  "event_interest",
  "saved_events",
  "email_log",
];

const PAGINA = 1000;

async function volcarTabla(tabla, carpeta) {
  const filas = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await db
      .from(tabla)
      .select("*")
      .range(desde, desde + PAGINA - 1);
    if (error) {
      // Tabla inexistente (migración no aplicada): se salta sin fallar.
      console.log(`  – ${tabla}: ${error.message}`);
      return;
    }
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
  }
  writeFileSync(join(carpeta, `${tabla}.json`), JSON.stringify(filas, null, 2));
  console.log(`  ✓ ${tabla}: ${filas.length} filas`);
}

const fecha = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
const carpeta = join("backups", fecha);
mkdirSync(carpeta, { recursive: true });

console.log(`Respaldando Supabase en ${carpeta}/ …`);
for (const t of TABLAS) await volcarTabla(t, carpeta);
console.log("\n✔ Respaldo completo. Guardá la carpeta en un lugar seguro (Drive, disco externo).");
