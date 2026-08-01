import Link from "next/link";
import type { CSSProperties } from "react";
import type { Vertical } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Tarjeta de vertical para el navegador del home (bento).
 * El color de identidad entra por variable CSS (--v) — un solo componente
 * sirve a las 6 verticales sin lógica condicional.
 */
export function VerticalCard({ vertical }: { vertical: Vertical }) {
  return (
    <Link
      href={`/${vertical.slug}`}
      style={{ "--v": vertical.colorVar } as CSSProperties}
      className="lift pressable group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-4"
    >
      {/* halo del color de la vertical */}
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-35"
        style={{ background: "var(--v)" }}
      />
      <span
        aria-hidden
        className="absolute left-0 top-0 h-1 w-12 rounded-br-full"
        style={{ background: "var(--v)" }}
      />
      <span className="kicker mb-1" style={{ color: "var(--v)" }}>
        {vertical.verb}
      </span>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-extrabold leading-tight tracking-tight text-ink md:text-lg">
          {vertical.name}
        </h3>
        <ArrowRightIcon
          width={18}
          height={18}
          className="mt-0.5 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
        />
      </div>
      <p className="clamp-2 mt-1 text-[13px] leading-snug text-muted">
        {vertical.blurb}
      </p>
    </Link>
  );
}
