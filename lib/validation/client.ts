/**
 * Validaciones ligeras para el NAVEGADOR (cero dependencias).
 * Son solo UX temprana: el servidor SIEMPRE re-valida con Zod
 * (lib/validation/*.ts), que es la fuente de verdad.
 */

/** Provincias de Costa Rica (dropdown de residencia en campañas). */
export const PROVINCIAS_CR = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
] as const;

export type ProvinciaCR = (typeof PROVINCIAS_CR)[number];

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const v = value.trim();
  return v === "" || /^[+]?[\d\s-]{8,20}$/.test(v);
}
