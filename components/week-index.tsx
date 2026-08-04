import Link from "next/link";
import type { Story } from "@/lib/content";
import { CategoryLabel } from "@/components/kicker";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Índice de la semana: filas tipográficas con numeral de índice, regla de
 * pelo y la fecha/hora fuerte en tabulares. La flecha aparece al hover.
 */
export function WeekIndex({ items }: { items: Story[] }) {
  return (
    <ul className="border-t border-rule">
      {items.map((s, i) => (
        <li key={s.id} data-reveal className="border-b border-rule">
          <Link
            href={s.href ?? `/${s.vertical}`}
            className="group flex items-baseline gap-4 py-4 md:gap-6"
          >
            <span className="label tnum hidden w-7 shrink-0 text-faint md:block">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <CategoryLabel vertical={s.vertical} className="mb-1.5" />
              <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand md:text-xl">
                {s.title}
              </h3>
            </div>
            {s.fechaIso ? (
              <time
                dateTime={s.fechaIso}
                className="tnum shrink-0 text-sm font-semibold text-ink md:text-base"
              >
                {s.meta}
              </time>
            ) : (
              <span className="tnum shrink-0 text-sm font-semibold text-ink md:text-base">
                {s.meta}
              </span>
            )}
            <ArrowRightIcon
              width={18}
              height={18}
              className="hidden shrink-0 self-center text-brand opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:block"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
