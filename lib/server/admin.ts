/**
 * Panel de administración — SOLO SERVIDOR.
 * Auth mínima por clave maestra (ADMIN_PANEL_KEY en Vercel): el panel es
 * una herramienta interna del dueño, sin cuentas ni sesiones. La clave viaja
 * en el header x-admin-key y se compara en tiempo constante.
 */
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** true cuando el panel está habilitado (hay clave configurada). */
export const adminConfigured = Boolean(process.env.ADMIN_PANEL_KEY);

export function checkAdminKey(req: Request): boolean {
  const esperado = process.env.ADMIN_PANEL_KEY;
  const recibido = req.headers.get("x-admin-key");
  if (!esperado || !recibido) return false;
  // Comparar hashes: timingSafeEqual exige longitudes iguales.
  const a = createHash("sha256").update(esperado).digest();
  const b = createHash("sha256").update(recibido).digest();
  return timingSafeEqual(a, b);
}

/* ── PIN de local ── */

// Sin caracteres ambiguos (0/O, 1/I/L): el staff lo teclea en un celular.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function tramo(largo: number): string {
  const bytes = randomBytes(largo);
  let s = "";
  for (let i = 0; i < largo; i++) s += ALFABETO[bytes[i] % ALFABETO.length];
  return s;
}

/**
 * PIN legible y no adivinable: PREFIJO-XXXX-XXXX (el prefijo sale del nombre
 * del local, para que el staff reconozca "su" PIN de un vistazo).
 */
export function generarPinLocal(nombre: string): string {
  const prefijo =
    nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 7) || "SEVIVE";
  return `${prefijo}-${tramo(4)}-${tramo(4)}`;
}

/** Slug URL-safe a partir del nombre del local. */
export function slugDeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
