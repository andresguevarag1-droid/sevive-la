import Link from "next/link";
import type { ReactNode } from "react";
import type { Story } from "@/lib/content";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";

/** Nota destacada con firma — imagen editorial + titular serif. */
export function StoryCard({ story }: { story: Story }) {
  const href = story.href ?? `/${story.vertical}`;
  // Un reel del buscador enlaza al video real (IG/TikTok): pestaña nueva
  // y sin acceso a window.opener, igual que las tarjetas de la videoteca.
  const externo = /^https?:\/\//i.test(href);
  const Enlace = ({ className, children }: { className?: string; children: ReactNode }) =>
    externo ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    ) : (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  return (
    <article>
      <Enlace className="imgzoom block">
        <EditorialImage src={story.img} alt="" ratio="3 / 2" sizes="(min-width: 768px) 33vw, 100vw" />
      </Enlace>
      <div className="pt-3.5">
        <CategoryLabel vertical={story.vertical} type={story.type} />
        <Enlace className="mt-2 block">
          <h3 className="text-xl font-bold tracking-tight leading-snug text-ink transition-colors hover:text-brand">
            {story.title}
          </h3>
        </Enlace>
        {story.dek ? (
          <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-muted">
            {story.dek}
          </p>
        ) : null}
        <p className="label mt-2.5 text-faint">
          {story.author ? `${story.author} — ` : ""}
          {story.meta}
        </p>
        {/* afordancia explícita de recirculación (R2) */}
        {externo ? (
          <Enlace className="label mt-2.5 inline-block text-brand">Ver el video →</Enlace>
        ) : story.type === "articulo" && story.href ? (
          <Enlace className="label mt-2.5 inline-block text-brand">Leer más →</Enlace>
        ) : null}
      </div>
    </article>
  );
}
