/**
 * "Seguí explorando" v2 (cierre de crónica): un plan + un beneficio en
 * tarjetas de revista. El evento se elige por RELEVANCIA — si la crónica
 * habla de Miss Grand, sugiere el evento de Miss Grand de la agenda — con
 * fecha tipo calendario, guardado directo y link al detalle. Todo medido.
 */
import Link from "next/link";
import { getEventosProximos, getBeneficioSugerido } from "@/lib/sanity/listados";
import type { EventoAgenda } from "@/lib/sanity/listados";
import type { VerticalSlug } from "@/lib/site";
import { CategoryLabel } from "@/components/kicker";
import { Beneficios } from "@/components/beneficios";
import { FavoritoButton } from "@/components/evento/favorito-button";
import { TrackClicks } from "@/components/track-clicks";
import { ArrowRightIcon } from "@/components/icons";

/** Tokens significativos (sin tildes, ≥4 letras) para emparejar por tema. */
function tokens(s: string): Set<string> {
  return new Set(
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4)
  );
}

/** Cuántos tokens de la crónica aparecen en el evento (título + lugar). */
function afinidad(deCronica: Set<string>, e: EventoAgenda): number {
  const deEvento = tokens(`${e.title} ${e.lugarNombre ?? ""}`);
  let puntos = 0;
  for (const t of deCronica) if (deEvento.has(t)) puntos++;
  return puntos;
}

function partesFecha(iso: string): { semana: string; dia: string; mes: string } {
  const d = new Date(iso);
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CR", { ...opts, timeZone: "America/Costa_Rica" })
      .format(d)
      .replace(/\./g, "");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    semana: cap(f({ weekday: "short" })),
    dia: f({ day: "numeric" }),
    mes: cap(f({ month: "short" })),
  };
}

export async function SeguiExplorando({
  titulo,
  bajada,
  vertical,
}: {
  titulo: string;
  bajada?: string;
  vertical: VerticalSlug;
}) {
  // Eventos completos (la afinidad temática necesita la lista) + UN solo
  // beneficio elegido en la consulta (antes venía la cuponera entera).
  const [eventos, sugerido] = await Promise.all([
    getEventosProximos(),
    getBeneficioSugerido(vertical),
  ]);

  // Evento: primero por afinidad temática; si no hay, el próximo de la vertical.
  const deCronica = tokens(`${titulo} ${bajada ?? ""}`);
  const conHref = eventos.filter((e) => e.href && e.inicio);
  const porAfinidad = conHref
    .map((e) => ({ e, puntos: afinidad(deCronica, e) }))
    .sort((a, b) => b.puntos - a.puntos)[0];
  const evento =
    porAfinidad && porAfinidad.puntos > 0
      ? porAfinidad.e
      : (conHref.find((e) => e.vertical === vertical) ?? conHref[0]);

  const beneficio =
    sugerido && sugerido.href ? [{ ...sugerido, sponsored: sugerido.patrocinado }] : [];

  if (!evento && beneficio.length === 0) return null;

  const fecha = evento ? partesFecha(evento.inicio) : null;
  const slugEvento = evento?.href?.split("/")[2] ?? "";

  return (
    <TrackClicks module="cronica_segui_explorando">
      <section className="mt-12">
        <div className="flex items-baseline gap-3 border-b border-ink pb-2">
          <h2 className="label text-ink">Seguí explorando</h2>
        </div>

        <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
          {/* ── El plan: tarjeta de evento con fecha-calendario y guardado ── */}
          {evento && fecha ? (
            <div>
              <p className="label mb-2 text-faint">El plan</p>
              <div className="card flex gap-5 px-5 py-5">
                <div className="flex w-14 shrink-0 flex-col items-center border-r border-rule pr-4 text-center">
                  <span className="label text-faint">{fecha.semana}</span>
                  <span className="headline tnum mt-0.5 text-4xl leading-none text-ink">
                    {fecha.dia}
                  </span>
                  <span className="label mt-1 text-faint">{fecha.mes}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <CategoryLabel vertical={evento.vertical} />
                  <Link href={evento.href!} className="group mt-1.5 block">
                    <h3 className="text-lg font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
                      {evento.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {evento.lugarNombre}
                    {evento.hora
                      ? `${evento.lugarNombre ? " · " : ""}${evento.hora}`
                      : `${evento.lugarNombre ? " · " : ""}Hora por confirmar`}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <FavoritoButton
                      slug={slugEvento}
                      titulo={evento.title}
                      inicio={evento.inicio}
                      lugar={evento.lugarNombre}
                      vertical={evento.vertical}
                    />
                    <Link
                      href={evento.href!}
                      className="label inline-flex items-center gap-1.5 text-brand"
                    >
                      Ver evento
                      <ArrowRightIcon width={14} height={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── El beneficio: cupón de la casa ── */}
          {beneficio.length > 0 ? (
            <div>
              <p className="label mb-2 text-faint">El beneficio</p>
              <Beneficios items={beneficio} gridClassName="grid-cols-1" />
            </div>
          ) : null}
        </div>
      </section>
    </TrackClicks>
  );
}
