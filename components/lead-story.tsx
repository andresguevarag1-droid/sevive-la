import Link from "next/link";
import type { Story } from "@/lib/content";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";

/** Nota líder de portada — asimétrica, la imagen manda, titular en serif. */
export function LeadStory({ story }: { story: Story }) {
  const href = `/${story.vertical}`;
  return (
    <article className="grid items-center gap-6 md:grid-cols-12 md:gap-10">
      <Link href={href} className="imgzoom block md:col-span-7">
        <EditorialImage
          src={story.img}
          alt={story.title}
          ratio="3 / 2"
          priority
        />
      </Link>

      <div className="md:col-span-5">
        <CategoryLabel vertical={story.vertical} type={story.type} />
        <Link href={href} className="mt-3 block">
          <h1 className="text-[clamp(2.1rem,5.5vw,3.6rem)] font-medium leading-[1.02]">
            {story.title}
          </h1>
        </Link>
        {story.dek ? (
          <p className="measure mt-4 text-lg leading-relaxed text-muted">
            {story.dek}
          </p>
        ) : null}
        <p className="label mt-5 text-faint">
          {story.author ? `${story.author} — ` : ""}
          {story.meta}
        </p>
      </div>
    </article>
  );
}
