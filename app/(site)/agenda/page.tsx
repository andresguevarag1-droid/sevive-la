import type { Metadata } from "next";
import Link from "next/link";
import { getEventosProximos, type EventoAgenda } from "@/lib/sanity/listados";
import { CategoryLabel } from "@/components/kicker";
import { ArrowRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Qué hacer en Costa Rica: eventos, conciertos, ferias y planes de la semana, curados por SeViveLa.",
  alternates: { canonical: "/agenda" },
};

type Filtro = "todos" | "hoy" | "finde";

const filtros: { key: Filtro; label: string; href: string }[] = [
  { key: "todos", label: "Todo", href: "/agenda" },
  { key: "hoy", label: "Hoy", href: "/agenda?f=hoy" },
  { key: "finde", label: "Fin de semana", href: "/agenda?f=finde" },
];

/** Día calendario (YYYY-MM-DD) de un ISO en hora de Costa Rica (UTC-6, sin DST). */
function diaCR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(d);
}

/** Aplica el filtro de fecha sobre la lista (en hora de Costa Rica). */
function filtrar(items: EventoAgenda[], filtro: Filtro): EventoAgenda[] {
  if (filtro === "todos") return items;
  const hoy = diaCR(new Date().toISOString());
  if (filtro === "hoy") {
    return items.filter((e) => e.inicio && diaCR(e.inicio) === hoy);
  }
  // Fin de semana: viernes a domingo de la semana en curso (o el actual si ya empezó).
  const ahora = new Date();
  const dowCR = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Costa_Rica",
  }).format(ahora);
  const indice: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const dow = indice[dowCR] ?? 1;
  const haciaViernes = 5 - dow; // negativo si ya es finde (retrocede al viernes en curso)
  const viernes = new Date(ahora.getTime() + haciaViernes * 86400000);
  const domingo = new Date(viernes.getTime() + 2 * 86400000);
  const desde = diaCR(viernes.toISOString());
  const hasta = diaCR(domingo.toISOString());
  return items.filter((e) => {
    if (!e.inicio) return false;
    const dia = diaCR(e.inicio);
    return dia >= desde && dia <= hasta;
  });
}

/** Partes del bloque de fecha estilo calendario de pared (hora CR). */
function partesDia(iso: string): {
  semana: string;
  dia: string;
  mes: string;
  finde: boolean;
} | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CR", { ...opts, timeZone: "America/Costa_Rica" })
      .format(d)
      .replace(/\./g, "");
  const dow = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Costa_Rica",
  }).format(d);
  return {
    semana: f({ weekday: "short" }),
    dia: f({ day: "numeric" }),
    mes: f({ month: "short" }),
    finde: dow === "Fri" || dow === "Sat" || dow === "Sun",
  };
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const { f } = await searchParams;
  const filtro: Filtro = f === "hoy" ? "hoy" : f === "finde" ? "finde" : "todos";

  const todos = await getEventosProximos();
  const eventos = filtrar(todos, filtro);

  // Agrupar por día (los eventos del mock, sin ISO, van en un solo grupo).
  const grupos = new Map<string, EventoAgenda[]>();
  for (const e of eventos) {
    const key = e.inicio && diaCR(e.inicio) ? diaCR(e.inicio) : "proximamente";
    const lista = grupos.get(key) ?? [];
    lista.push(e);
    grupos.set(key, lista);
  }

  // Eventos con fecha real → datos estructurados (SEO enriquecido + GEO)
  const conFecha = eventos.filter((e) => e.inicio);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {conFecha.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Agenda de eventos en Costa Rica",
            itemListElement: conFecha.slice(0, 20).map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Event",
                name: e.title,
                startDate: e.inicio,
                eventStatus: "https://schema.org/EventScheduled",
                location: e.lugarNombre
                  ? {
                      "@type": "Place",
                      name: e.lugarNombre,
                      address: { "@type": "PostalAddress", addressCountry: "CR" },
                    }
                  : undefined,
                organizer: { "@type": "Organization", name: site.name, url: site.url },
              },
            })),
          }}
        />
      ) : null}
      <header>
        <p className="label text-brand">Qué hacer</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Agenda</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Eventos, conciertos y ferias en Costa Rica, curados por la redacción.
        </p>
      </header>

      {/* ── Filtros rápidos ── */}
      <nav aria-label="Filtros de fecha" className="mt-6 flex gap-2">
        {filtros.map((opcion) => {
          const activo = opcion.key === filtro;
          return (
            <Link
              key={opcion.key}
              href={opcion.href}
              aria-current={activo ? "page" : undefined}
              className="chip pressable border"
              style={
                activo
                  ? {
                      background: "var(--color-ink)",
                      color: "var(--color-paper)",
                      borderColor: "var(--color-ink)",
                    }
                  : { borderColor: "var(--color-rule)", color: "var(--color-muted)" }
              }
            >
              {opcion.label}
            </Link>
          );
        })}
      </nav>

      {eventos.length === 0 ? (
        /* ── Estado vacío ── */
        <div className="py-16 text-center md:py-24">
          <p className="label text-faint">Nada por aquí</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            {filtro === "hoy"
              ? "Hoy no tenemos eventos registrados."
              : filtro === "finde"
                ? "Este fin de semana aún no tiene eventos registrados."
                : "La agenda se está cocinando."}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Probá con otro filtro o volvé pronto: el equipo publica planes toda
            la semana.
          </p>
          <Link
            href="/agenda"
            className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Ver toda la agenda
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          {[...grupos.entries()].map(([dia, items]) => {
            const partes = items[0].inicio ? partesDia(items[0].inicio) : null;
            const esHoy = dia === diaCR(new Date().toISOString());
            const colorDia = esHoy
              ? "var(--color-brand)"
              : partes?.finde
                ? "var(--color-deep)"
                : "var(--color-ink)";
            return (
              <section
                key={dia}
                className="mb-12 grid gap-2 md:grid-cols-[128px_1fr] md:gap-10"
              >
                {/* ── Bloque de fecha, calendario de pared ── */}
                <h2
                  data-reveal
                  className="flex items-baseline gap-3 border-t-2 pb-1 pt-2 md:sticky md:top-20 md:block md:self-start md:pb-0 md:pt-3"
                  style={{ borderColor: colorDia }}
                >
                  {partes ? (
                    <>
                      <span className="label block" style={{ color: colorDia }}>
                        {partes.semana}
                      </span>
                      <span
                        className="headline tnum block text-5xl leading-none md:mt-1 md:text-7xl"
                        style={{ color: colorDia }}
                      >
                        {partes.dia}
                      </span>
                      <span className="label block text-faint md:mt-1.5">
                        {partes.mes}
                      </span>
                      {esHoy ? (
                        <span className="label mt-0 inline-block bg-brand px-2 py-0.5 text-[10px] text-white md:mt-3">
                          Hoy
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="label text-ink">Próximamente</span>
                  )}
                </h2>

                {/* ── Eventos del día: la hora manda ── */}
                <ul className="border-t border-rule">
                  {items.map((e) => (
                    <li key={e.id} data-reveal className="border-b border-rule">
                      <Link
                        href={e.href ?? `/${e.vertical}`}
                        className="group flex items-baseline gap-4 py-5 md:gap-6"
                      >
                        <span className="tnum w-14 shrink-0 md:w-16">
                          {e.hora ? (
                            <span className="text-base font-bold text-ink md:text-lg">
                              {e.hora}
                            </span>
                          ) : (
                            <span className="label text-faint">Por confirmar</span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <CategoryLabel vertical={e.vertical} className="mb-1.5" />
                          <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand md:text-xl">
                            {e.title}
                          </h3>
                          {e.lugarNombre ? (
                            <p className="mt-1 text-sm text-muted">{e.lugarNombre}</p>
                          ) : null}
                        </div>
                        <ArrowRightIcon
                          width={18}
                          height={18}
                          className="hidden shrink-0 self-center text-brand opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100 md:block"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
