import Link from "next/link";
import type { Story } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Nota líder de portada — drama de revista: titular serif gigante,
 * la imagen manda, firma sobre regla de pelo y llamado a leer.
 */
export function LeadStory({
  story,
  as: Heading = "h1",
}: {
  story: Story;
  /** "h2" cuando hay una campaña activa (el hero de campaña lleva el h1). */
  as?: "h1" | "h2";
}) {
  const href = `/${story.vertical}`;
  const color = verticalColor(story.vertical);

  return (
    <article>
      {/* kicker de portada */}
      <div className="mb-5 flex items-baseline gap-3 border-b-2 border-ink pb-2">
        <span className="label text-brand">Portada</span>
        <span className="label tnum ml-auto text-faint">
          {new Intl.DateTimeFormat("es-CR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "America/Costa_Rica",
          })
            .format(new Date())
            .replace(/^./, (c) => c.toUpperCase())}
        </span>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-12 md:gap-12">
        <Link href={href} className="imgzoom relative block md:col-span-7">
          <EditorialImage
            src={story.img}
            alt={story.title}
            ratio="3 / 2"
            priority
          />
          {/* barra de identidad de la vertical sobre la foto */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-1.5 w-24 md:w-32"
            style={{ background: color }}
          />
        </Link>

        <div className="md:col-span-5">
          <CategoryLabel vertical={story.vertical} type={story.type} />
          <Link href={href} className="mt-3 block">
            <Heading className="headline text-[clamp(2.3rem,6vw,4.1rem)] font-medium leading-[0.99] tracking-[-0.015em]">
              {story.title}
            </Heading>
          </Link>
          {story.dek ? (
            <p className="measure mt-5 text-lg leading-relaxed text-muted">
              {story.dek}
            </p>
          ) : null}
          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-rule pt-4">
            <p className="label text-faint">
              {story.author ? `${story.author} — ` : ""}
              {story.meta}
            </p>
            <Link
              href={href}
              className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand"
            >
              Ver sección
              <ArrowRightIcon
                width={16}
                height={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
