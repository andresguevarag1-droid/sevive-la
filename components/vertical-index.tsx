import Link from "next/link";
import type { SVGProps } from "react";
import { verticals, type VerticalSlug } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Secciones como CARTEL DE FESTIVAL: seis bandas apiladas a lo ancho en la
 * paleta del flyer, nombre gigante en serif, ÍCONO TEMÁTICO fantasma de
 * fondo (sin números), verbo como pill y estrella al hover. Sólidos planos.
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
    ghost: "rgba(255,255,255,0.30)",
    pill: "rgba(255,255,255,0.55)",
  },
  entretenimiento: {
    bg: "#ffd200",
    text: "#3b1f87", // morado profundo sobre amarillo, como el flyer
    sub: "rgba(59,31,135,0.85)",
    ghost: "rgba(59,31,135,0.24)",
    pill: "rgba(59,31,135,0.5)",
  },
  cultura: {
    bg: "#7a1f6e",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.85)",
    ghost: "rgba(255,255,255,0.22)",
    pill: "rgba(255,255,255,0.5)",
  },
  gastronomia: {
    bg: "#c22a20",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.9)",
    ghost: "rgba(255,255,255,0.25)",
    pill: "rgba(255,255,255,0.5)",
  },
  turismo: {
    bg: "#a190d2",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.95)",
    ghost: "rgba(255,255,255,0.32)",
    pill: "rgba(255,255,255,0.6)",
  },
  "estilo-de-vida": {
    bg: "#c71e70",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.9)",
    ghost: "rgba(255,255,255,0.25)",
    pill: "rgba(255,255,255,0.5)",
  },
};

/* ── Íconos temáticos (trazo, heredan color vía stroke) ── */
type IconProps = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Experiencias — brújula (aventura, planes). */
function BrujulaIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.6 13.6 8.5 15.5l1.9-5.1z" />
    </svg>
  );
}

/** Entretenimiento — nota musical. */
function NotaIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9 18V5.5L19 3v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </svg>
  );
}

/** Cultura — fachada de museo. */
function MuseoIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="m12 3 9 5H3z" />
      <path d="M5 8v9M9.5 8v9M14.5 8v9M19 8v9M3 17h18v3H3z" />
    </svg>
  );
}

/** Gastronomía — tenedor y cuchillo. */
function CubiertosIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M7 3v5a2 2 0 0 0 2 2v11M5 3v5M9 3v5" />
      <path d="M17 21V3c2.5 3 2.5 7.5 0 10" />
    </svg>
  );
}

/** Turismo — palmera. */
function PalmeraIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M13 21c-1-5-1-8 0-11" />
      <path d="M13 10C10 6.5 6.5 6 4.5 8c2.5-.5 5.5.5 8.5 2z" />
      <path d="M13 10c-.5-4.5 1.5-7 4.5-7-1.5 1.5-3.5 3.5-4.5 7z" />
      <path d="M13 10c2.5-3 6-3.5 8-1.5-2.5-.5-5.5 0-8 1.5z" />
      <path d="M6 21h13" />
    </svg>
  );
}

/** Estilo de vida — corazón. */
function CorazonIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 20S5 15.5 3.2 11C1.8 7.5 4.2 4.5 7.4 4.5c1.9 0 3.5 1 4.6 3 1.1-2 2.7-3 4.6-3 3.2 0 5.6 3 4.2 6.5C19 15.5 12 20 12 20z" />
    </svg>
  );
}

const ICONO: Record<VerticalSlug, (p: IconProps) => React.JSX.Element> = {
  experiencias: BrujulaIcon,
  entretenimiento: NotaIcon,
  cultura: MuseoIcon,
  gastronomia: CubiertosIcon,
  turismo: PalmeraIcon,
  "estilo-de-vida": CorazonIcon,
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
      {verticals.map((v) => {
        const p = FLYER_PALETTE[v.slug];
        const Icono = ICONO[v.slug];
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            style={{ background: p.bg, color: p.text }}
            className="pressable group relative block overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] transition-[transform,box-shadow,filter] duration-300 ease-[var(--ease-out)] hover:shadow-[var(--shadow-card-hover)] md:hover:-translate-y-0.5 md:hover:brightness-105"
          >
            {/* ícono temático fantasma de fondo, como afiche */}
            <Icono
              className="pointer-events-none absolute -right-4 -top-6 h-32 w-32 -rotate-12 md:-top-8 md:h-40 md:w-40"
              style={{ color: p.ghost }}
            />

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
                  {v.verb}
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
