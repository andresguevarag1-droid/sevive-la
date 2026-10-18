/**
 * Paleta del fondo de campaña, compartida entre el hero de home
 * (`hero-campana.tsx`) y el header de la landing (`landing-campana.tsx`)
 * para que ambos pinten siempre el mismo color por campaña.
 */
import type { Campana } from "@/lib/sanity/campana";

/** Degradado festivo por defecto (naranja→magenta, estilo Latin Grammys). */
export const FONDO_DEFAULT =
  "linear-gradient(160deg, #f7941d 0%, #ef4136 38%, #c71e70 72%, #7a1f6e 100%)";

/**
 * Fallback turnkey de paleta por campaña mientras el documento no defina
 * `coloresFondo` en Sanity (fuente de verdad preferida). Solo cubre el
 * arranque de campañas puntuales; cualquier campaña nueva se pinta desde
 * el Studio sin tocar código.
 */
const PALETAS_POR_SLUG: Record<string, string[]> = {
  // Miss Universe 2026 — paleta del flyer, para diferenciarla de Latin Grammys.
  "te-llevamos-a-miss-universe-2026": ["#019793", "#015d9d", "#253053"],
};

/** Arma un linear-gradient repartiendo las paradas de forma pareja. */
function degradadoDesde(cols: string[]): string {
  const paradas = cols
    .map((c, i) => `${c} ${Math.round((i / (cols.length - 1)) * 100)}%`)
    .join(", ");
  return `linear-gradient(160deg, ${paradas})`;
}

/** Paleta efectiva: el campo de Sanity manda; si no, un default por slug. */
export function paletaCampana(
  campana: Pick<Campana, "coloresFondo" | "slug">
): string[] | undefined {
  return campana.coloresFondo && campana.coloresFondo.length >= 2
    ? campana.coloresFondo
    : PALETAS_POR_SLUG[campana.slug];
}

/** Degradado CSS final: paleta efectiva o, si no hay, el festivo de siempre. */
export function fondoCampana(
  campana: Pick<Campana, "coloresFondo" | "slug">
): string {
  const paleta = paletaCampana(campana);
  return paleta ? degradadoDesde(paleta) : FONDO_DEFAULT;
}
