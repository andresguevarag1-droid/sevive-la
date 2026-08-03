import Link from "next/link";
import type { CSSProperties } from "react";
import type { Story } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";

/**
 * Beneficios como cupones editoriales de revista: talón con la oferta grande,
 * perforación punteada con muescas y color de la vertical como acento.
 * El patrocinio siempre se etiqueta.
 */
export function Beneficios({ items }: { items: Story[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((b) => {
        const color = verticalColor(b.vertical);
        const v = getVertical(b.vertical);
        const accent: CSSProperties = { color };
        return (
          <Link
            key={b.id}
            href={b.href ?? "/promociones"}
            data-reveal
            className="card pressable group relative flex overflow-hidden"
          >
            {/* barra de identidad de la vertical */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: color }}
            />

            {/* ── Cuerpo del cupón ── */}
            <div className="min-w-0 flex-1 px-5 py-5">
              <p className="label text-faint">
                {b.author}
                {b.sponsored ? " · Patrocinado" : ""}
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
                {b.title}
              </h3>
              <p className="label mt-2" style={accent}>
                {v?.name}
              </p>
            </div>

            {/* ── Perforación: línea punteada con muescas arriba y abajo ── */}
            <div aria-hidden className="relative w-0 border-l border-dashed border-rule">
              <span className="absolute -left-[7px] -top-[7px] h-3.5 w-3.5 rounded-full border border-rule-soft bg-paper" />
              <span className="absolute -bottom-[7px] -left-[7px] h-3.5 w-3.5 rounded-full border border-rule-soft bg-paper" />
            </div>

            {/* ── Talón con la oferta ── */}
            <div className="flex w-[38%] max-w-40 shrink-0 items-center justify-center px-4 py-5 text-center">
              <p className="tnum text-[15px] font-bold leading-snug tracking-tight text-brand">
                {b.meta}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
