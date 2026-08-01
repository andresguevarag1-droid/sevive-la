import Link from "next/link";
import type { Story } from "@/lib/content";
import { CategoryLabel } from "@/components/kicker";

/** Índice de la semana: contenidos tipográficos separados por regla de pelo. */
export function WeekIndex({ items }: { items: Story[] }) {
  return (
    <ul className="border-t border-rule">
      {items.map((s) => (
        <li key={s.id} className="border-b border-rule">
          <Link
            href={`/${s.vertical}`}
            className="group flex items-baseline justify-between gap-6 py-3.5"
          >
            <div className="min-w-0">
              <CategoryLabel vertical={s.vertical} className="mb-1" />
              <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
                {s.title}
              </h3>
            </div>
            <span className="label tnum shrink-0 text-faint">{s.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
