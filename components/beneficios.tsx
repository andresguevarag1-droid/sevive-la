import Link from "next/link";
import type { Story } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Beneficios como cupones de revista, nivel imprenta: talón SÓLIDO en el
 * color de la vertical con la cifra de la oferta gigante en blanco,
 * perforación punteada con muescas troqueladas y cierre "Ver beneficio".
 * El patrocinio siempre se etiqueta.
 */

/** Separa la oferta en cifra protagonista y letra chica.
 *  "30% · código VIVELA30" → grande "30%", resto "código VIVELA30". */
function partirOferta(meta: string): { grande: string; resto?: string } {
  const m = meta.trim();
  const porPunto = m.split("·").map((s) => s.trim());
  if (porPunto.length > 1 && porPunto[0].length <= 8) {
    return { grande: porPunto[0], resto: porPunto.slice(1).join(" · ") };
  }
  const [primero, ...resto] = m.split(" ");
  if (/^(\d+%|2x1|2×1|gratis)$/i.test(primero)) {
    return { grande: primero.replace(/x/i, "×"), resto: resto.join(" ") || undefined };
  }
  return { grande: m };
}

export function Beneficios({ items }: { items: Story[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((b) => {
        const color = verticalColor(b.vertical);
        const v = getVertical(b.vertical);
        const oferta = partirOferta(b.meta ?? "");
        return (
          <Link
            key={b.id}
            href={b.href ?? "/promociones"}
            data-reveal
            className="card pressable group relative flex overflow-hidden"
          >
            {/* ── Cuerpo del cupón ── */}
            <div className="flex min-w-0 flex-1 flex-col px-5 py-5">
              <p className="label text-faint">
                {b.author}
                {b.sponsored ? " · Patrocinado" : ""}
              </p>
              <h3 className="mt-1.5 text-xl font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
                {b.title}
              </h3>
              <p className="label mt-1.5" style={{ color }}>
                {v?.name}
              </p>
              <p className="label mt-auto flex items-center gap-1.5 pt-5 text-brand">
                Ver beneficio
                <ArrowRightIcon
                  width={14}
                  height={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </p>
            </div>

            {/* ── Perforación: punteado con muescas troqueladas ── */}
            <div aria-hidden className="relative w-0 border-l border-dashed border-rule">
              <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-paper" />
              <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-paper" />
            </div>

            {/* ── Talón sólido: la oferta manda ── */}
            <div
              className="relative flex w-[40%] max-w-44 shrink-0 flex-col items-center justify-center px-4 py-6 text-center text-white"
              style={{ background: color }}
            >
              <p className="tnum text-[clamp(1.7rem,4vw,2.2rem)] font-black uppercase leading-none tracking-tight">
                {oferta.grande}
              </p>
              {oferta.resto ? (
                <p className="label mt-2 text-white/85">{oferta.resto}</p>
              ) : null}
              {/* micro-firma de imprenta en el borde */}
              <span
                aria-hidden
                className="label absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-white/40"
                style={{ writingMode: "vertical-rl" }}
              >
                SEVIVELA
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
