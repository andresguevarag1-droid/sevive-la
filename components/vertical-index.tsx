import Link from "next/link";
import type { CSSProperties } from "react";
import { verticals } from "@/lib/site";
import { verticalColor } from "@/lib/content";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Las 6 secciones como tarjetas modernas con tinte suave del color de la
 * vertical (color por sección, sin degradados de relleno). Blend editorial + v2.
 */
export function VerticalIndex() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {verticals.map((v, i) => {
        const color = verticalColor(v.slug);
        const style: CSSProperties = {
          background: `color-mix(in srgb, ${color} 8%, #ffffff)`,
          borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
        };
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            style={style}
            className="card pressable group flex min-h-32 flex-col justify-between rounded-[var(--radius-lg)] p-4"
          >
            <div className="flex items-start justify-between">
              <span className="label tnum" style={{ color }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <ArrowRightIcon
                width={18}
                height={18}
                className="text-muted transition-transform duration-300 group-hover:translate-x-1"
                style={{ color }}
              />
            </div>
            <div className="mt-3">
              <h3
                className="text-lg font-bold leading-tight tracking-tight text-ink"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {v.name}
              </h3>
              <p className="clamp-2 mt-1 text-[13px] leading-snug text-muted">
                {v.blurb}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
