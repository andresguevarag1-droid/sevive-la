import Link from "next/link";
import { agendaWeek } from "@/lib/content";

/** Vista compacta de 7 días con conteo de actividades — genera tráfico recurrente. */
export function AgendaWeek() {
  return (
    <div className="rail -mx-4 px-4 md:mx-0 md:grid md:grid-cols-7 md:gap-3 md:px-0">
      {agendaWeek.map((d) => (
        <Link
          key={d.day}
          href="/agenda"
          data-today={d.today}
          className="lift pressable flex w-[4.5rem] flex-col items-center gap-1 rounded-[var(--radius-lg)] border border-line bg-surface p-3 text-center data-[today=true]:border-brand data-[today=true]:bg-brand data-[today=true]:text-brand-ink md:w-auto"
        >
          <span className="kicker opacity-70">{d.day}</span>
          <span className="text-2xl font-extrabold leading-none">{d.date}</span>
          <span className="mt-1 text-[11px] font-medium opacity-80">
            {d.count} planes
          </span>
        </Link>
      ))}
    </div>
  );
}
