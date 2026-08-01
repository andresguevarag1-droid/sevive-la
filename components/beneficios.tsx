import Link from "next/link";
import type { Story } from "@/lib/content";

/** Índice de beneficios de marcas aliadas — restringido, sin tarjetas de color. */
export function Beneficios({ items }: { items: Story[] }) {
  return (
    <ul className="border-t border-rule">
      {items.map((b) => (
        <li key={b.id} className="border-b border-rule">
          <Link
            href="/promociones"
            className="group flex items-baseline justify-between gap-6 py-3.5"
          >
            <div className="min-w-0">
              <span className="label text-faint">{b.author}</span>
              <h3 className="headline text-lg font-medium leading-snug text-ink transition-colors group-hover:text-brand">
                {b.title}
              </h3>
            </div>
            <span className="label tnum shrink-0 text-brand">{b.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
