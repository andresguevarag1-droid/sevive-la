import Link from "next/link";
import type { Item } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { MediaBlock } from "@/components/media-block";
import { TypeBadge } from "@/components/badges";

/**
 * Editorial destacado con jerarquía de revista: 1 pieza grande + 3 chicas.
 */
export function EditorialFeature({ items }: { items: Item[] }) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  const leadVertical = getVertical(lead.vertical);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Pieza principal */}
      <Link
        href={`/${lead.vertical}`}
        className="lift pressable group block overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface"
      >
        <MediaBlock vertical={lead.vertical} aspect="4 / 3">
          <div className="p-4">
            <TypeBadge type={lead.type} />
          </div>
          <div className="mt-auto p-4">
            <span
              className="serif-italic block text-lg text-white/90"
              style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
            >
              {leadVertical?.name}
            </span>
            <h3
              className="mt-1 text-2xl font-extrabold leading-tight text-white md:text-3xl"
              style={{ textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}
            >
              {lead.title}
            </h3>
          </div>
        </MediaBlock>
        <div className="px-4 py-3 text-sm font-medium text-muted">
          {lead.meta}
        </div>
      </Link>

      {/* Lista secundaria */}
      <ul className="flex flex-col divide-y divide-[var(--color-line)]">
        {rest.map((item) => {
          const v = getVertical(item.vertical);
          return (
            <li key={item.id}>
              <Link
                href={`/${item.vertical}`}
                className="group flex gap-4 py-3 first:pt-0"
              >
                <MediaBlock
                  vertical={item.vertical}
                  aspect="1 / 1"
                  className="w-24 shrink-0 rounded-[var(--radius-md)]"
                />
                <div className="min-w-0">
                  <span
                    className="kicker"
                    style={{ color: verticalColor(item.vertical) }}
                  >
                    {v?.name}
                  </span>
                  <h3 className="clamp-2 mt-1 font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
                    {item.title}
                  </h3>
                  <span className="mt-1 block text-xs text-muted">
                    {item.meta}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
