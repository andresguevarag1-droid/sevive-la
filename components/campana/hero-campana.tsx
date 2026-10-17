import Link from "next/link";
import type { Campana } from "@/lib/sanity/campana";

/**
 * Hero de campaña en la home — se permite que "grite". El fondo sale de
 * `coloresFondo` (Sanity) para diferenciar campañas; si no, degradado festivo
 * por defecto. CTA siempre en el lila de marca y radios del sistema.
 * Server component: cero JS. Texto vivo (SEO/a11y), el arte es capa visual.
 */

/** Estrella de cuatro puntas (como las del flyer), SVG liviano. */
function Estrella({
  size,
  color,
  className,
  style,
}: {
  size: number;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden
      className={className}
      style={style}
    >
      <path d="M12 0c1 6.5 4.5 10 12 12-7.5 2-11 5.5-12 12-1-6.5-4.5-10-12-12 7.5-2 11-5.5 12-12z" />
    </svg>
  );
}

/** Degradado festivo por defecto (naranja→magenta, estilo Latin Grammys). */
const FONDO_DEFAULT =
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

export function HeroCampana({
  campana,
  as: Titular = "h1",
}: {
  campana: Campana;
  /** "h1" por defecto; usar "h2" si se apila más de una campaña a la vez. */
  as?: "h1" | "h2";
}) {
  // Paleta: el campo de Sanity manda; si no, un default por slug; si no, el festivo.
  const paleta =
    campana.coloresFondo && campana.coloresFondo.length >= 2
      ? campana.coloresFondo
      : PALETAS_POR_SLUG[campana.slug];
  const fondo = paleta ? degradadoDesde(paleta) : FONDO_DEFAULT;
  // Acentos coherentes con la paleta (estrellas y barras del borde inferior).
  const estrellas = paleta
    ? ["#ffffff", "#ffffff", paleta[0]]
    : ["#ffd200", "#ffffff", "#3b1f87"];
  const barras = paleta
    ? [paleta[0], paleta[1] ?? paleta[0], "#a190d2"]
    : ["#ffd200", "#f7941d", "#a190d2"];

  return (
    <section
      aria-label={`Campaña: ${campana.titulo}`}
      className="relative overflow-hidden"
      style={{ background: fondo }}
    >
      {/* estrellas decorativas con titileo lento (se apaga con reduced-motion) */}
      <Estrella size={54} color={estrellas[0]} className="twinkle absolute left-[4%] top-8 opacity-80" />
      <Estrella
        size={30}
        color={estrellas[1]}
        className="twinkle absolute right-[8%] top-14 opacity-60"
        style={{ animationDelay: "1.4s" }}
      />
      <Estrella
        size={40}
        color={estrellas[2]}
        className="twinkle absolute bottom-10 left-[12%] opacity-50"
        style={{ animationDelay: "2.6s" }}
      />

      {/* velo de tinta: sube el contraste del texto sobre el degradado */}
      <div aria-hidden className="absolute inset-0 bg-[rgba(26,21,38,0.05)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:gap-12 md:py-16">
        <div className="relative">
          {/* kicker — lila de marca */}
          <span className="label inline-block rounded-full bg-lilac px-3.5 py-1.5 text-ink">
            Dinámica · Participá gratis
          </span>

          {/* Titular en mayúsculas y minúsculas, serif editorial */}
          <Titular className="mt-5 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1.02] text-white [text-wrap:balance]">
            {campana.titulo}
          </Titular>

          <p className="mt-4 max-w-xl text-lg font-semibold leading-snug text-white/95 md:text-2xl">
            {campana.subtitulo}
          </p>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Link
              href={`/dinamicas/${campana.slug}`}
              className="pressable inline-block rounded-[var(--radius-full)] bg-lilac px-8 py-4 text-base font-bold uppercase tracking-wide text-ink shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-2 ring-white/90 transition-all hover:brightness-105"
            >
              {campana.ctaTexto}
            </Link>
            {campana.microcopy ? (
              <p className="label text-white/85">{campana.microcopy}</p>
            ) : null}
          </div>
        </div>

        {/* arte de la campaña (flyer), como afiche pegado */}
        {campana.imagenHero ? (
          <div className="relative mx-auto w-full max-w-xs md:max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campana.imagenHeroSet?.s800 ?? campana.imagenHero}
              srcSet={
                campana.imagenHeroSet
                  ? `${campana.imagenHeroSet.s480} 480w, ${campana.imagenHeroSet.s800} 800w, ${campana.imagenHeroSet.s1200} 1200w`
                  : undefined
              }
              sizes="(min-width: 768px) 384px, 90vw"
              alt={campana.imagenHeroAlt ?? campana.titulo}
              width={480}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="w-full -rotate-2 rounded-[var(--radius-lg)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[var(--ease-out)] hover:rotate-0"
            />
          </div>
        ) : null}
      </div>

      {/* arcoíris inferior (capas de color, como el flyer) */}
      <div aria-hidden className="flex h-3 w-full">
        <div className="h-full flex-1" style={{ background: barras[0] }} />
      </div>
      <div aria-hidden className="flex h-2.5 w-full" style={{ background: barras[1] }} />
      <div aria-hidden className="flex h-2 w-full" style={{ background: barras[2] }} />
    </section>
  );
}
