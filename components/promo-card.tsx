import Link from "next/link";
import type { Item } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";

/** Tarjeta de promoción con acento de vertical y vigencia visible. */
export function PromoCard({ item }: { item: Item }) {
  const v = getVertical(item.vertical);
  const color = verticalColor(item.vertical);
  return (
    <Link
      href="/promociones"
      className="lift pressable group block w-72 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface"
    >
      {/* franja de color de la vertical */}
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="kicker" style={{ color }}>
            {v?.name}
          </span>
          {item.sponsored ? (
            <span className="text-[11px] font-semibold text-muted">
              {item.sponsored}
            </span>
          ) : null}
        </div>
        <h3 className="clamp-2 mt-2 text-lg font-bold leading-snug text-ink">
          {item.title}
        </h3>
        <div className="mt-3 flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: "var(--color-surface-2)", color }}
          >
            {item.meta}
          </span>
          <span className="text-sm font-semibold text-brand">Ver →</span>
        </div>
      </div>
    </Link>
  );
}
