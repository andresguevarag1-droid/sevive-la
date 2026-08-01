import Link from "next/link";
import type { Story } from "@/lib/content";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";

/** Nota destacada con firma — imagen editorial + titular serif. */
export function StoryCard({ story }: { story: Story }) {
  const href = `/${story.vertical}`;
  return (
    <article>
      <Link href={href} className="imgzoom block">
        <EditorialImage src={story.img} alt={story.title} ratio="3 / 2" />
      </Link>
      <div className="pt-3.5">
        <CategoryLabel vertical={story.vertical} type={story.type} />
        <Link href={href} className="mt-2 block">
          <h3 className="text-xl font-bold tracking-tight leading-snug text-ink transition-colors hover:text-brand">
            {story.title}
          </h3>
        </Link>
        {story.dek ? (
          <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-muted">
            {story.dek}
          </p>
        ) : null}
        <p className="label mt-2.5 text-faint">
          {story.author ? `${story.author} — ` : ""}
          {story.meta}
        </p>
      </div>
    </article>
  );
}
