import type { Metadata } from "next";
import Link from "next/link";
import { getEventosProximos, type EventoAgenda } from "@/lib/sanity/listados";
import { verticalsVisibles, type VerticalSlug } from "@/lib/site";
import { verticalColor, verticalColorTexto } from "@/lib/content";
import { CategoryLabel } from "@/components/kicker";
import { CorazonGuardar } from "@/components/agenda/corazon-guardar";
import { BoletinAgenda } from "@/components/agenda/boletin-agenda";
import { TrackClicks } from "@/components/track-clicks";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Qué hacer en Costa Rica hoy, este fin de semana y los próximos días: conciertos, teatro, ferias y exposiciones con fecha, hora y lugar verificados por SeViveLa.",
  alternates: { canonical: "/agenda" },
};

type Filtro = "todos" | "hoy" | "finde";

const filtros: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todo" },
  { key: "hoy", label: "Hoy" },
  { key: "finde", label: "Fin de semana" },
];

/** Día calendario (YYYY-MM-DD) de un ISO en hora de Costa Rica (UTC-6, sin DST). */
function diaCR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(d);
}

/** Aplica el filtro de fecha sobre la lista (en hora de Costa Rica).
 *  Un evento "en curso" (con fin) cuenta en todo día que abarca. */
function filtrar(items: EventoAgenda[], filtro: Filtro): EventoAgenda[] {
  if (filtro === "todos") return items;
  const hoy = diaCR(new Date().toISOString());
  const abarca = (e: EventoAgenda, desde: string, hasta: string) => {
    if (!e.inicio) return false;
    const ini = diaCR(e.inicio);
    const fin = e.fin ? diaCR(e.fin) : ini;
    return ini <= hasta && fin >= desde;
  };
  if (filtro === "hoy") {
    return items.filter((e) => abarca(e, hoy, hoy));
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
  return items.filter((e) => abarca(e, desde, hasta));
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

/** Construye la URL de la agenda con los filtros combinados. */
function urlAgenda(f: Filtro, v?: VerticalSlug | null): string {
  const p = new URLSearchParams();
  if (f !== "todos") p.set("f", f);
  if (v) p.set("v", v);
  const q = p.toString();
  return q ? `/agenda?${q}` : "/agenda";
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; v?: string }>;
}) {
  const { f, v } = await searchParams;
  const filtro: Filtro = f === "hoy" ? "hoy" : f === "finde" ? "finde" : "todos";
  const verticalActiva =
    verticalsVisibles.find((x) => x.slug === v)?.slug ?? null;

  const todos = await getEventosProximos();
  const porFecha = filtrar(todos, filtro);
  const eventos = verticalActiva
    ? porFecha.filter((e) => e.vertical === verticalActiva)
    : porFecha;

  // Conteo editorial de la cabecera (sobre TODO el horizonte, sin filtros).
  const totalProximos = todos.filter((e) => e.inicio).length;
  const totalHoy = filtrar(todos, "hoy").length;

  // Agrupar por día. Los ya iniciados con fin futuro (exposiciones,
  // temporadas) van en un grupo "En curso" al inicio; el mock sin ISO, al final.
  const hoyCR = diaCR(new Date().toISOString());
  const mananaCR = diaCR(new Date(Date.now() + 86400000).toISOString());
  const enCurso = (e: EventoAgenda) =>
    Boolean(e.inicio && e.fin && diaCR(e.inicio) < hoyCR && new Date(e.fin) >= new Date());
  const grupos = new Map<string, EventoAgenda[]>();
  for (const e of eventos) {
    const key = enCurso(e)
      ? "encurso"
      : e.inicio && diaCR(e.inicio)
        ? diaCR(e.inicio)
        : "proximamente";
    const lista = grupos.get(key) ?? [];
    lista.push(e);
    grupos.set(key, lista);
  }

  // Salto rápido por día (solo días reales, en orden).
  const diasConEventos = [...grupos.keys()]
    .filter((k) => k !== "encurso" && k !== "proximamente")
    .sort();

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
            inLanguage: site.locale,
            itemListElement: conFecha.slice(0, 20).map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Event",
                name: e.title,
                startDate: e.inicio,
                eventStatus: "https://schema.org/EventScheduled",
                location: {
                  "@type": "Place",
                  name: e.lugarNombre ?? "Costa Rica",
                  address: { "@type": "PostalAddress", addressCountry: "CR" },
                },
                organizer: { "@type": "Organization", name: site.name, url: site.url },
                ...(e.href ? { url: `${site.url}${e.href}` } : {}),
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
        {totalProximos > 0 ? (
          <p className="headline mt-4 text-[clamp(1.1rem,2.6vw,1.4rem)] leading-snug text-ink">
            <span className="tnum">{totalProximos}</span>{" "}
            {totalProximos === 1 ? "plan verificado" : "planes verificados"}
            {totalHoy > 0 ? (
              <span className="text-muted">
                {" "}
                · <span className="tnum">{totalHoy}</span> {totalHoy === 1 ? "es hoy" : "son hoy"}
              </span>
            ) : null}
          </p>
        ) : null}
      </header>

      <TrackClicks module="agenda_filtros">
        {/* ── Filtros de fecha + acceso a lo guardado ── */}
        <nav aria-label="Filtros de fecha" className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/mi-agenda"
            className="chip pressable ml-auto order-last border"
            style={{ borderColor: "var(--color-rule)", color: "var(--color-brand)" }}
          >
            ♥ Mi agenda
          </Link>
          {filtros.map((opcion) => {
            const activo = opcion.key === filtro;
            return (
              <Link
                key={opcion.key}
                href={urlAgenda(opcion.key, verticalActiva)}
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

        {/* ── Filtros por sección (color de cada vertical) ── */}
        <nav aria-label="Filtros por sección" className="mt-2.5 flex flex-wrap items-center gap-2">
          {verticalsVisibles.map((vert) => {
            const activo = vert.slug === verticalActiva;
            const color = verticalColor(vert.slug);
            return (
              <Link
                key={vert.slug}
                // Tocar la sección activa la des-selecciona (toggle).
                href={urlAgenda(filtro, activo ? null : vert.slug)}
                aria-current={activo ? "page" : undefined}
                className="chip pressable inline-flex items-center gap-2 border"
                style={
                  activo
                    ? {
                        borderColor: color,
                        color: verticalColorTexto(vert.slug),
                        borderWidth: 2,
                        fontWeight: 700,
                      }
                    : { borderColor: "var(--color-rule)", color: "var(--color-muted)" }
                }
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                {vert.name}
              </Link>
            );
          })}
        </nav>

        {/* ── Salto rápido por día (sticky al hacer scroll) ── */}
        {diasConEventos.length > 2 ? (
          <nav
            aria-label="Ir a un día"
            className="sticky top-[41px] z-30 -mx-4 mt-6 overflow-x-auto border-b border-rule bg-paper px-4 py-2.5"
          >
            <div className="flex w-max items-center gap-2">
              {diasConEventos.slice(0, 14).map((dia) => {
                const p = partesDia(`${dia}T12:00:00-06:00`);
                if (!p) return null;
                const esHoy = dia === hoyCR;
                const esManana = dia === mananaCR;
                return (
                  <a
                    key={dia}
                    href={`#d-${dia}`}
                    className="chip pressable tnum shrink-0 border"
                    style={
                      esHoy
                        ? {
                            background: "var(--color-brand)",
                            color: "#fff",
                            borderColor: "var(--color-brand)",
                          }
                        : {
                            borderColor: "var(--color-rule)",
                            color: p.finde ? "var(--color-deep)" : "var(--color-muted)",
                            fontWeight: p.finde ? 700 : 500,
                          }
                    }
                  >
                    {esHoy ? "Hoy" : esManana ? "Mañana" : `${cap(p.semana)} ${p.dia}`}
                  </a>
                );
              })}
            </div>
          </nav>
        ) : null}
      </TrackClicks>

      {eventos.length === 0 ? (
        /* ── Estado vacío ── */
        <div className="py-16 text-center md:py-24">
          <p className="label text-faint">Nada por aquí</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            {verticalActiva
              ? "Esa sección aún no tiene eventos con este filtro."
              : filtro === "hoy"
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
            const esEnCurso = dia === "encurso";
            const partes =
              !esEnCurso && items[0].inicio ? partesDia(items[0].inicio) : null;
            const esHoy = dia === hoyCR;
            const colorDia = esHoy
              ? "var(--color-brand)"
              : partes?.finde
                ? "var(--color-deep)"
                : "var(--color-ink)";
            return (
              <section
                key={dia}
                id={esEnCurso || dia === "proximamente" ? undefined : `d-${dia}`}
                className="mb-12 grid scroll-mt-28 gap-2 md:grid-cols-[128px_1fr] md:gap-10"
              >
                {/* ── Bloque de fecha, calendario de pared ── */}
                <h2
                  data-reveal
                  className="flex items-baseline gap-3 border-t-2 pb-1 pt-2 md:sticky md:top-20 md:block md:self-start md:pb-0 md:pt-3"
                  style={{ borderColor: colorDia }}
                >
                  {partes ? (
                    <time dateTime={dia} className="contents">
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
                    </time>
                  ) : (
                    <span className="label text-ink">
                      {esEnCurso ? "En curso" : "Próximamente"}
                    </span>
                  )}
                </h2>

                {/* ── Eventos del día: la hora manda, el corazón guarda ── */}
                <ul className="border-t border-rule">
                  {items.map((e) => {
                    const slug = e.href?.startsWith("/agenda/")
                      ? e.href.split("/")[2]
                      : null;
                    return (
                      <li
                        key={e.id}
                        data-reveal
                        className="flex items-baseline gap-4 border-b border-rule py-5 md:gap-6"
                      >
                        <span className="tnum w-12 shrink-0 md:w-16">
                          {e.hora ? (
                            <time
                              dateTime={e.inicio}
                              className="text-base font-bold text-ink md:text-lg"
                            >
                              {e.hora}
                            </time>
                          ) : (
                            <span aria-hidden className="text-base text-faint">
                              —
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={e.href ?? `/${e.vertical}`} className="group block">
                            <CategoryLabel vertical={e.vertical} className="mb-1.5" />
                            <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand md:text-xl">
                              {e.title}
                            </h3>
                            {e.lugarNombre || !e.hora || enCurso(e) ? (
                              <p className="mt-1 text-sm text-muted">
                                {e.lugarNombre}
                                {enCurso(e) && e.fin ? (
                                  <>
                                    {e.lugarNombre ? " · " : ""}Hasta el{" "}
                                    <time dateTime={diaCR(e.fin)}>
                                      {new Intl.DateTimeFormat("es-CR", {
                                        day: "numeric",
                                        month: "long",
                                        timeZone: "America/Costa_Rica",
                                      }).format(new Date(e.fin))}
                                    </time>
                                  </>
                                ) : !e.hora ? (
                                  `${e.lugarNombre ? " · " : ""}Hora por confirmar`
                                ) : (
                                  ""
                                )}
                              </p>
                            ) : null}
                          </Link>
                        </div>
                        {slug && e.inicio ? (
                          <CorazonGuardar
                            slug={slug}
                            titulo={e.title}
                            inicio={e.inicio}
                            lugar={e.lugarNombre}
                            vertical={e.vertical}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Captura contextual: la agenda por correo ── */}
      <BoletinAgenda />
    </section>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
