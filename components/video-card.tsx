import Link from "next/link";
import type { Item } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { MediaBlock } from "@/components/media-block";
import { PlayIcon } from "@/components/icons";

/** Tarjeta de video vertical 9:16 (nace de Reels/TikTok). */
export function VideoCard({ item }: { item: Item }) {
  const vertical = getVertical(item.vertical);
  return (
    <Link
      href="/videos"
      className="lift pressable group block w-40 overflow-hidden rounded-[var(--radius-lg)] border border-line"
    >
      <MediaBlock vertical={item.vertical} aspect="9 / 16">
        <div className="flex items-center justify-between p-2.5">
          <span
            className="kicker text-white/90"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
          >
            {vertical?.name}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink transition-transform duration-200 group-hover:scale-110">
            <PlayIcon width={20} height={20} className="ml-0.5" />
          </span>
        </div>

        <div className="p-2.5">
          <h3 className="clamp-2 text-sm font-semibold leading-snug text-white">
            {item.title}
          </h3>
          <span className="mt-1 block text-[11px] font-medium text-white/80">
            {item.meta}
          </span>
        </div>
      </MediaBlock>
    </Link>
  );
}
