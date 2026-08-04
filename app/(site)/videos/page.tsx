import type { Metadata } from "next";
import { getReels } from "@/lib/sanity/listados";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { PlayIcon } from "@/components/icons";
import { ReelSinFoto } from "@/components/reel-sin-foto";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Reels de SeViveLa: sodas, volcanes, festivales y planes de Costa Rica en video vertical.",
  alternates: { canonical: "/videos" },
};

export const revalidate = 60;

export default async function VideosPage() {
  const reels = await getReels();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Videoteca</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">En video</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Los planes, en formato vertical. Como en el feed, pero sin perderte
          en el feed.
        </p>
      </header>

      {reels.length === 0 ? (
        /* ── Estado vacío ── */
        <div className="py-16 text-center md:py-24">
          <p className="label text-faint">Muy pronto</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            Estamos montando la videoteca.
          </h2>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
          {reels.map((v) => {
            const vert = getVertical(v.vertical);
            return (
              <article
                key={v.id}
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
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 42%, rgba(0,0,0,0) 68%)",
                  }}
                />
                <span
                  className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: verticalColor(v.vertical) }}
                >
                  {vert?.name}
                </span>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink">
                    <PlayIcon width={19} height={19} className="ml-0.5" />
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h2 className="clamp-2 text-sm font-semibold leading-snug text-white">
                    {v.title}
                  </h2>
                  {v.meta ? (
                    <span className="mt-1 block text-[11px] font-medium text-white/80">
                      {v.meta}
                    </span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
