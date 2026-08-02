import Link from "next/link";
import { verticals, type VerticalSlug } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Las 6 secciones con la paleta festiva del flyer de campaña (naranja,
 * amarillo, morado, rojo, lila, magenta). Colores sólidos, sin degradados.
 * El texto alterna tinta/blanco según contraste AA de cada fondo.
 * (La identidad de vertical en chips y etiquetas del resto del sitio
 * mantiene los tonos editoriales de lib/content.ts.)
 */
const FLYER_PALETTE: Record<
  VerticalSlug,
  { bg: string; text: string; sub: string }
> = {
  experiencias: {
    bg: "#f7941d", // naranja
    text: "var(--color-ink)",
    sub: "rgba(26,21,38,0.78)",
  },
  entretenimiento: {
    bg: "#ffd200", // amarillo
    text: "var(--color-ink)",
    sub: "rgba(26,21,38,0.78)",
  },
  cultura: {
    bg: "#7a1f6e", // morado
    text: "#ffffff",
    sub: "rgba(255,255,255,0.85)",
  },
  gastronomia: {
    bg: "#c22a20", // rojo profundo
    text: "#ffffff",
    sub: "rgba(255,255,255,0.88)",
  },
  turismo: {
    bg: "#a190d2", // lila de marca
    text: "var(--color-ink)",
    sub: "rgba(26,21,38,0.78)",
  },
  "estilo-de-vida": {
    bg: "#c71e70", // magenta
    text: "#ffffff",
    sub: "rgba(255,255,255,0.88)",
  },
};

export function VerticalIndex() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {verticals.map((v, i) => {
        const paleta = FLYER_PALETTE[v.slug];
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            style={{ background: paleta.bg, color: paleta.text, borderColor: "transparent" }}
            className="card pressable group flex min-h-36 flex-col justify-between rounded-[var(--radius-lg)] p-4 md:min-h-40 md:p-5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="label tnum" style={{ color: paleta.sub }}>
                {String(i + 1).padStart(2, "0")} · {v.verb}
              </span>
              <ArrowRightIcon
                width={18}
                height={18}
                className="shrink-0 self-center transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>
            <div className="mt-4">
              <h3 className="headline text-[clamp(1.35rem,2.6vw,1.8rem)]">
                {v.name}
              </h3>
              <p
                className="clamp-2 mt-1.5 text-[13px] leading-snug"
                style={{ color: paleta.sub }}
              >
                {v.blurb}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
