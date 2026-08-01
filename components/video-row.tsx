import Link from "next/link";
import type { Story } from "@/lib/content";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";
import { PlayIcon } from "@/components/icons";

/** Fila de video — miniatura editorial con affordance de reproducción. */
export function VideoRow({ items }: { items: Story[] }) {
  return (
    <div className="grid gap-x-6 gap-y-8 md:grid-cols-3">
      {items.map((v) => (
        <article key={v.id}>
          <Link href="/videos" className="imgzoom relative block">
            <EditorialImage src={v.img} alt={v.title} ratio="16 / 9" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/90 text-ink">
                <PlayIcon width={20} height={20} className="ml-0.5" />
              </span>
            </span>
          </Link>
          <div className="pt-3">
            <CategoryLabel vertical={v.vertical} />
            <Link href="/videos" className="mt-1.5 block">
              <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors hover:text-brand">
                {v.title}
              </h3>
            </Link>
            <span className="label tnum mt-1.5 block text-faint">{v.meta}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
