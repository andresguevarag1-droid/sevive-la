import Link from "next/link";
import type { Campana } from "@/lib/sanity/campana";

/**
 * Hero de campaña en la home — se permite que "grite" (fiesta naranja→magenta)
 * pero con el CTA en el magenta de marca y los radios del sistema.
 * Server component: cero JS. Texto vivo (SEO/a11y), el arte es capa visual.
 */

/** Estrella de cuatro puntas (como las del flyer), SVG liviano. */
function Estrella({
  size,
  color,
  className,
}: {
  size: number;
  color: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden
      className={className}
    >
      <path d="M12 0c1 6.5 4.5 10 12 12-7.5 2-11 5.5-12 12-1-6.5-4.5-10-12-12 7.5-2 11-5.5 12-12z" />
    </svg>
  );
}

export function HeroCampana({ campana }: { campana: Campana }) {
  return (
    <section
      aria-label={`Campaña: ${campana.titulo}`}
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #f7941d 0%, #ef4136 38%, #c71e70 72%, #7a1f6e 100%)",
      }}
    >
      {/* estrellas decorativas (estáticas: sin animación que respete nada) */}
      <Estrella size={54} color="#ffd200" className="absolute left-[4%] top-8 opacity-80" />
      <Estrella size={30} color="#ffffff" className="absolute right-[8%] top-14 opacity-60" />
      <Estrella size={40} color="#3b1f87" className="absolute bottom-10 left-[12%] opacity-50" />

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:gap-12 md:py-16">
        <div className="relative">
          {/* kicker */}
          <span
            className="label inline-block rounded-full px-3.5 py-1.5 text-white"
            style={{ background: "#3b1f87" }}
          >
            Dinámica · Participá gratis
          </span>

          <h1 className="mt-5 font-sans text-[clamp(2.4rem,7vw,4.6rem)] font-black uppercase leading-[0.95] tracking-tight text-white [text-wrap:balance]">
            {campana.titulo}
          </h1>

          <p className="mt-4 max-w-xl text-lg font-semibold leading-snug text-white/95 md:text-2xl">
            {campana.subtitulo}
          </p>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Link
              href={`/dinamicas/${campana.slug}`}
              className="pressable inline-block rounded-[var(--radius-full)] bg-brand px-8 py-4 text-base font-bold uppercase tracking-wide text-brand-ink shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] ring-2 ring-white/90 transition-colors hover:bg-brand-hover"
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
              src={campana.imagenHero}
              alt={campana.imagenHeroAlt ?? campana.titulo}
              width={480}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="w-full -rotate-2 rounded-[var(--radius-lg)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.5)]"
            />
          </div>
        ) : null}
      </div>

      {/* arcoíris inferior (capas de color, como el flyer) */}
      <div aria-hidden className="flex h-3 w-full">
        <div className="h-full flex-1" style={{ background: "#ffd200" }} />
      </div>
      <div aria-hidden className="flex h-2.5 w-full" style={{ background: "#f7941d" }} />
      <div aria-hidden className="flex h-2 w-full" style={{ background: "#a190d2" }} />
    </section>
  );
}
