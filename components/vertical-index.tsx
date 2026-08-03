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

/* ── Pictogramas temáticos (geometría de señalética: trazo uniforme,
      terminales rectas, sin inclinación — serios, no cartoon) ── */
type IconProps = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

/** Experiencias — brújula de instrumento: aro, marcas cardinales y aguja. */
function BrujulaIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v1.8M12 18.7v1.8M20.5 12h-1.8M5.3 12H3.5" />
      <path d="M12 6.6 13.9 12 12 17.4 10.1 12z" />
    </svg>
  );
}

/** Entretenimiento — boleto de entrada con perforación. */
function BoletoIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
      <path d="M15.5 7v10" strokeDasharray="1.8 1.8" />
    </svg>
  );
}

/** Cultura — fachada clásica: frontón, columnata y basamento. */
function MuseoIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3.5 9 12 4l8.5 5z" />
      <path d="M4.5 11.5h15" />
      <path d="M6 11.5v5.5M10 11.5v5.5M14 11.5v5.5M18 11.5v5.5" />
      <path d="M4.5 17h15M3.5 19.5h17" />
    </svg>
  );
}

/** Gastronomía — cubiertos verticales, paralelos. */
function CubiertosIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3.5v4.5a2.2 2.2 0 0 0 2.2 2.2V20.5M10.4 3.5v4.5a2.2 2.2 0 0 1-2.2 2.2M8.2 3.5V8" />
      <path d="M16.6 20.5v-17c2.6 2.9 2.6 8.1 0 11" />
    </svg>
  );
}

/** Turismo — volcán (cono con cráter), perfil del paisaje tico. */
function VolcanIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M9.2 6h5.6L20.5 19.5h-17z" />
      <path d="M9.9 12.5c1.4 1.2 2.8 1.2 4.2 0" />
    </svg>
  );
}

/** Estilo de vida — corazón simétrico, línea limpia. */
function CorazonIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 19.5C7.2 15.9 4.2 12.9 4.2 9.7 4.2 7.2 6.1 5.2 8.5 5.2c1.4 0 2.7.7 3.5 2 .8-1.3 2.1-2 3.5-2 2.4 0 4.3 2 4.3 4.5 0 3.2-3 6.2-7.8 9.8z" />
    </svg>
  );
}

const ICONO: Record<VerticalSlug, (p: IconProps) => React.JSX.Element> = {
  experiencias: BrujulaIcon,
  entretenimiento: BoletoIcon,
  cultura: MuseoIcon,
  gastronomia: CubiertosIcon,
  turismo: VolcanIcon,
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
            {/* pictograma fantasma: recto, centrado y con aire (sello, no sticker) */}
            <Icono
              className="pointer-events-none absolute right-12 top-1/2 h-16 w-16 -translate-y-1/2 md:right-24 md:h-20 md:w-20"
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
