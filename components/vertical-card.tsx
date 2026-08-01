import Link from "next/link";
import type { Vertical } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Tarjeta de vertical para el navegador del home (bento grid).
 * El color de identidad entra por variable CSS (--v) para que el mismo
 * componente sirva a las 6 verticales sin lógica condicional.
 */
export function VerticalCard({ vertical }: { vertical: Vertical }) {
  return (
    <Link
      href={`/${vertical.slug}`}
      style={{ "--v": vertical.colorVar } as React.CSSProperties}
      className="group relative flex min-h-40 flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-4 transition-transform duration-300 ease-[var(--ease-brand)] active:scale-[0.98]"
    >
      {/* halo de color de la vertical */}
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: "var(--v)" }}
      />
      <span
        className="mb-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--v)" }}
      >
        {vertical.verb}
      </span>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-extrabold text-ink">{vertical.name}</h3>
        <ArrowRightIcon
          width={20}
          height={20}
          className="shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
        />
      </div>
      <p className="clamp-2 mt-1 text-sm text-muted">{vertical.blurb}</p>
    </Link>
  );
}
