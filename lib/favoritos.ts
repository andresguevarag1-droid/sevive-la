/**
 * Favoritos / "Mi agenda" (R3) — SOLO CLIENTE, sin login.
 * Snapshot del evento en localStorage: la lista funciona aunque el evento
 * salga de las listas públicas. La señal de interés viaja a la analítica.
 */
import type { VerticalSlug } from "@/lib/site";

const CLAVE = "sv_favoritos";

/** Evento que se emite tras cada cambio, para que listas abiertas se refresquen. */
export const FAVORITOS_EVENT = "sv-favoritos";

function emitirCambio(): void {
  try {
    window.dispatchEvent(new Event(FAVORITOS_EVENT));
  } catch {
    /* sin window */
  }
}

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
    emitirCambio();
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
    emitirCambio();
  } catch {
    /* sin memoria local */
  }
}

/** Vuelve a guardar un favorito tal cual estaba (deshacer un "quitar"). */
export function restaurarFavorito(f: Favorito): void {
  try {
    const lista = getFavoritos();
    if (!lista.some((x) => x.slug === f.slug)) {
      localStorage.setItem(CLAVE, JSON.stringify([...lista, f].slice(-100)));
    }
    emitirCambio();
  } catch {
    /* sin memoria local */
  }
}
