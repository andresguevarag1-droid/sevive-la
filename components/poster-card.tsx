import Link from "next/link";
import type { Item } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { MediaBlock } from "@/components/media-block";
import { TypeBadge, SponsoredTag } from "@/components/badges";

/**
 * Tarjeta de contenido para rails horizontales.
 * Media (placeholder de foto) arriba + bloque de texto editorial abajo.
 */
export function PosterCard({
  item,
  className = "w-64",
}: {
  item: Item;
  className?: string;
}) {
  const vertical = getVertical(item.vertical);
  return (
    <Link
      href={`/${item.vertical}`}
      className={`lift pressable group block overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface ${className}`}
    >
      <MediaBlock vertical={item.vertical} aspect="16 / 10">
        <div className="flex items-start justify-between p-3">
          <TypeBadge type={item.type} />
        </div>
        <div className="mt-auto px-3 pb-3">
          <span
            className="kicker text-white/90"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            {vertical?.name}
          </span>
        </div>
      </MediaBlock>
      <div className="p-3.5">
        <h3 className="clamp-2 font-semibold leading-snug text-ink">
          {item.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-xs font-semibold"
            style={{ color: verticalColor(item.vertical) }}
          >
            {item.meta}
          </span>
        </div>
        {item.sponsored ? (
          <div className="mt-2.5">
            <SponsoredTag by={item.sponsored} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
