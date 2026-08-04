import type { Story } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { PlayIcon } from "@/components/icons";
import { ReelSinFoto } from "@/components/reel-sin-foto";
import { ReelCardLink } from "@/components/reel-card-link";

/**
 * Reels: rail horizontal de tarjetas verticales 9:16 (tipo TikTok/Reels).
 * Título y categoría sobre la imagen; se desliza con scroll-snap.
 */
export function VideoRow({ items }: { items: Story[] }) {
  return (
    <div data-reveal className="rail -mx-4 px-4 md:mx-0 md:px-0">
      {items.map((v) => {
        const vert = getVertical(v.vertical);
        return (
          <ReelCardLink
            key={v.id}
            href={v.href}
            className="pressable group block w-[188px] md:w-[224px]"
          >
            <div
              className="imgzoom relative overflow-hidden rounded-[var(--radius-lg)] bg-paper-2 shadow-[var(--shadow-card)]"
              style={{ aspectRatio: "9 / 16" }}
            >
              {v.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.img}
                  alt={v.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <ReelSinFoto vertical={v.vertical} />
              )}
              {/* scrim para legibilidad del texto */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 42%, rgba(0,0,0,0) 68%)",
                }}
              />
              {/* categoría (pill sólida arriba) */}
              <span
                className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: verticalColor(v.vertical) }}
              >
                {vert?.name}
              </span>
              {/* botón de reproducción */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink transition-transform duration-200 group-hover:scale-110">
                  <PlayIcon width={19} height={19} className="ml-0.5" />
                </span>
              </span>
              {/* título + duración */}
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h3 className="clamp-2 text-sm font-semibold leading-snug text-white">
                  {v.title}
                </h3>
                <span className="mt-1 block text-[11px] font-medium text-white/80">
                  {v.meta}
                </span>
              </div>
            </div>
          </ReelCardLink>
        );
      })}
    </div>
  );
}
