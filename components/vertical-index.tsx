import Link from "next/link";
import type { CSSProperties } from "react";
import { verticals } from "@/lib/site";
import { verticalColor } from "@/lib/content";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Las 6 secciones como tarjetas con carácter: superficie teñida con el color
 * de la vertical (sin degradados), verbo de marca como kicker y nombre grande
 * en serif. El color es identidad funcional, no decoración.
 */
export function VerticalIndex() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {verticals.map((v, i) => {
        const color = verticalColor(v.slug);
        const style: CSSProperties = {
          background: `color-mix(in srgb, ${color} 13%, #ffffff)`,
          borderColor: `color-mix(in srgb, ${color} 34%, transparent)`,
        };
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            style={style}
            className="card pressable group flex min-h-36 flex-col justify-between rounded-[var(--radius-lg)] p-4 md:min-h-40 md:p-5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="label tnum" style={{ color }}>
                {String(i + 1).padStart(2, "0")} · {v.verb}
              </span>
              <ArrowRightIcon
                width={18}
                height={18}
                className="shrink-0 self-center transition-transform duration-300 group-hover:translate-x-1"
                style={{ color }}
              />
            </div>
            <div className="mt-4">
              <h3 className="headline text-[clamp(1.35rem,2.6vw,1.8rem)] text-ink">
                {v.name}
              </h3>
              <p className="clamp-2 mt-1.5 text-[13px] leading-snug text-muted">
                {v.blurb}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
