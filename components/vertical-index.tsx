import Link from "next/link";
import { verticals } from "@/lib/site";
import { verticalColor } from "@/lib/content";

/** Las 6 secciones como índice editorial — número, nombre serif, punto de color. */
export function VerticalIndex() {
  return (
    <div className="grid border-t border-rule md:grid-cols-2 md:gap-x-12">
      {verticals.map((v, i) => (
        <Link
          key={v.slug}
          href={`/${v.slug}`}
          className="group flex items-baseline justify-between gap-4 border-b border-rule py-4"
        >
          <div className="flex items-baseline gap-3">
            <span className="label tnum text-faint">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="headline text-2xl font-medium text-ink transition-colors group-hover:text-brand">
                {v.name}
              </h3>
              <p className="mt-0.5 text-sm text-muted">{v.blurb}</p>
            </div>
          </div>
          <span
            aria-hidden
            className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: verticalColor(v.slug) }}
          />
        </Link>
      ))}
    </div>
  );
}
