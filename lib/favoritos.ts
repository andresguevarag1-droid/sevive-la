/**
 * Favoritos / "Mi agenda" (R3) — SOLO CLIENTE, sin login.
 * Snapshot del evento en localStorage: la lista funciona aunque el evento
 * salga de las listas públicas. La señal de interés viaja a la analítica.
 */
import type { VerticalSlug } from "@/lib/site";

const CLAVE = "sv_favoritos";

export type Favorito = {
  slug: string;
  title: string;
  inicio: string;
  lugar?: string;
  vertical: VerticalSlug;
  guardadoEn: string;
};

export function getFavoritos(): Favorito[] {
  try {
    const raw = localStorage.getItem(CLAVE);
    const lista = raw ? (JSON.parse(raw) as Favorito[]) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function esFavorito(slug: string): boolean {
  return getFavoritos().some((f) => f.slug === slug);
}

/** Agrega o quita; devuelve true si quedó guardado. */
export function toggleFavorito(f: Omit<Favorito, "guardadoEn">): boolean {
  const lista = getFavoritos();
  const existe = lista.some((x) => x.slug === f.slug);
  const nueva = existe
    ? lista.filter((x) => x.slug !== f.slug)
    : [...lista, { ...f, guardadoEn: new Date().toISOString() }].slice(-100);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {
    /* sin memoria local */
  }
  return !existe;
}

export function quitarFavorito(slug: string): void {
  try {
    localStorage.setItem(
      CLAVE,
      JSON.stringify(getFavoritos().filter((f) => f.slug !== slug))
    );
  } catch {
    /* sin memoria local */
  }
}
