import Link from "next/link";
import { verticals, type VerticalSlug } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Secciones como CARTEL DE FESTIVAL: seis bandas apiladas a lo ancho en la
 * paleta del flyer, nombre gigante en serif, numeral fantasma, verbo como
 * pill y estrella de cuatro puntas como guiño. Sólidos planos, cero JS.
 * (En la banda amarilla el texto va morado profundo, como en el flyer.)
 */

type Paleta = {
  bg: string;
  text: string;
  sub: string;
  ghost: string;
  pill: string;
};

const FLYER_PALETTE: Record<VerticalSlug, Paleta> = {
  experiencias: {
    bg: "#f7941d",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.92)",
    ghost: "rgba(255,255,255,0.32)",
    pill: "rgba(255,255,255,0.55)",
  },
  entretenimiento: {
    bg: "#ffd200",
    text: "#3b1f87", // morado profundo sobre amarillo, como el flyer
    sub: "rgba(59,31,135,0.85)",
    ghost: "rgba(59,31,135,0.28)",
    pill: "rgba(59,31,135,0.5)",
  },
  cultura: {
    bg: "#7a1f6e",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.85)",
    ghost: "rgba(255,255,255,0.25)",
    pill: "rgba(255,255,255,0.5)",
  },
  gastronomia: {
    bg: "#c22a20",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.9)",
    ghost: "rgba(255,255,255,0.28)",
    pill: "rgba(255,255,255,0.5)",
  },
  turismo: {
    bg: "#a190d2",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.95)",
    ghost: "rgba(255,255,255,0.35)",
    pill: "rgba(255,255,255,0.6)",
  },
  "estilo-de-vida": {
    bg: "#c71e70",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.9)",
    ghost: "rgba(255,255,255,0.28)",
    pill: "rgba(255,255,255,0.5)",
  },
};

/** Estrella de cuatro puntas del flyer. */
function Estrella({ size, color, className }: { size: number; color: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden className={className}>
      <path d="M12 0c1 6.5 4.5 10 12 12-7.5 2-11 5.5-12 12-1-6.5-4.5-10-12-12 7.5-2 11-5.5 12-12z" />
    </svg>
  );
}

export function VerticalIndex() {
  return (
    <div className="flex flex-col gap-2.5 md:gap-3">
      {verticals.map((v, i) => {
        const p = FLYER_PALETTE[v.slug];
        const numero = String(i + 1).padStart(2, "0");
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            style={{ background: p.bg, color: p.text }}
            className="pressable group relative block overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] transition-[transform,box-shadow,filter] duration-300 ease-[var(--ease-out)] hover:shadow-[var(--shadow-card-hover)] md:hover:-translate-y-0.5 md:hover:brightness-105"
          >
            {/* numeral fantasma de fondo, como afiche */}
            <span
              aria-hidden
              className="tnum pointer-events-none absolute -right-2 -top-7 select-none font-serif text-[7rem] font-semibold leading-none md:-top-10 md:text-[9.5rem]"
              style={{ color: p.ghost }}
            >
              {numero}
            </span>

            {/* estrella que aparece al hover (solo puntero fino) */}
            <Estrella
              size={26}
              color={p.ghost}
              className="absolute left-[46%] top-3 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
            />

            <div className="relative flex items-center gap-4 px-5 py-5 md:gap-8 md:px-8 md:py-6">
              {/* verbo como pill */}
              <span
                className="label hidden shrink-0 rounded-full border px-3 py-1 md:inline-block"
                style={{ borderColor: p.pill, color: p.text }}
              >
                {v.verb}
              </span>

              <div className="min-w-0 flex-1">
                <span className="label mb-0.5 block md:hidden" style={{ color: p.sub }}>
                  {numero} · {v.verb}
                </span>
                <span className="headline block text-[clamp(1.8rem,5.5vw,3rem)] leading-none">
                  {v.name}
                </span>
                <span
                  className="clamp-2 mt-1 block max-w-xl text-[13px] leading-snug md:text-sm"
                  style={{ color: p.sub }}
                >
                  {v.blurb}
                </span>
              </div>

              <ArrowRightIcon
                width={26}
                height={26}
                className="shrink-0 transition-transform duration-300 group-hover:translate-x-1.5"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
