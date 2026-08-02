import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { getEvento, getEventosRelacionados } from "@/lib/sanity/evento";
import { getVertical, site } from "@/lib/site";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";
import { WeekIndex } from "@/components/week-index";
import { JsonLd } from "@/components/json-ld";
import { ArrowRightIcon } from "@/components/icons";

type Params = { slug: string };

export const revalidate = 300;

/** "Viernes 14 de agosto, 20:00" (o sin hora), en hora de Costa Rica. */
function fmtLargo(iso: string, conHora: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(conHora ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false } : {}),
    timeZone: "America/Costa_Rica",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** ¿Mismo día calendario en CR? */
function mismoDia(a: string, b: string): boolean {
  const f = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date(iso));
  return f(a) === f(b);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEvento(slug);
  if (!e) return {};
  const fecha = fmtLargo(e.inicio, false);
  const description =
    e.descripcion ??
    `${e.title}${e.lugar ? ` en ${e.lugar}` : ""} — ${fecha}. Agenda de SeViveLa.`;
  return {
    title: `${e.title} — ${fecha}`,
    description,
    openGraph: {
      title: e.title,
      description,
      images: e.imagen ? [{ url: e.imagen }] : undefined,
    },
    alternates: { canonical: `/agenda/${e.slug}` },
  };
}

export default async function EventoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const e = await getEvento(slug);
  if (!e) notFound();

  const v = getVertical(e.vertical);
  const relacionados = await getEventosRelacionados(e.vertical, e.id);
  const conHora = !e.horaPorConfirmar;
  const esRango = e.fin && !mismoDia(e.inicio, e.fin);
  const pasado = new Date(e.fin ?? e.inicio).getTime() < Date.now() - 12 * 60 * 60 * 1000;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      {/* Datos estructurados: Event con oferta (SEO local + GEO) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: e.title,
          startDate: e.inicio,
          endDate: e.fin ?? undefined,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          description: e.descripcion,
          image: e.imagen,
          location: e.lugar
            ? {
                "@type": "Place",
                name: e.lugar,
                address: { "@type": "PostalAddress", addressCountry: "CR" },
              }
            : undefined,
          organizer: e.organizador
            ? { "@type": "Organization", name: e.organizador }
            : { "@type": "Organization", name: site.name, url: site.url },
          offers: e.enlace
            ? {
                "@type": "Offer",
                url: e.enlace,
                availability: pasado
                  ? "https://schema.org/SoldOut"
                  : "https://schema.org/InStock",
              }
            : undefined,
        }}
      />

      {/* ── Breadcrumb ── */}
      <nav aria-label="Ruta" className="label text-faint">
        <Link href="/agenda" className="ulink hover:text-ink">
          Agenda
        </Link>{" "}
        <span aria-hidden>›</span> {v?.name}
      </nav>

      {/* ── Cabecera ── */}
      <header className="mt-4">
        <CategoryLabel vertical={e.vertical} type="evento" />
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.4rem)] leading-[1.02]">
          {e.title}
        </h1>
        {e.descripcion ? (
          <p className="measure mt-3 text-lg leading-relaxed text-muted">
            {e.descripcion}
          </p>
        ) : null}
      </header>

      {e.imagen ? (
        <div className="mt-6">
          <EditorialImage src={e.imagen} alt={e.imagenAlt ?? e.title} ratio="16 / 9" priority />
        </div>
      ) : null}

      {/* ── Ficha: cuándo, dónde, cuánto ── */}
      <dl className="mt-6 divide-y divide-rule border-y border-rule">
        <div className="flex gap-6 py-3.5">
          <dt className="label w-24 shrink-0 text-faint">Cuándo</dt>
          <dd className="tnum text-sm font-semibold text-ink">
            {esRango
              ? `Del ${fmtLargo(e.inicio, false).toLowerCase()} al ${fmtLargo(e.fin!, false).toLowerCase()}`
              : fmtLargo(e.inicio, conHora)}
            {!conHora ? (
              <span className="ml-2 font-normal text-faint">Hora por confirmar</span>
            ) : null}
          </dd>
        </div>
        {e.lugar ? (
          <div className="flex gap-6 py-3.5">
            <dt className="label w-24 shrink-0 text-faint">Dónde</dt>
            <dd className="text-sm font-semibold text-ink">
              {e.lugar}
              {e.mapaUrl ? (
                <>
                  {" · "}
                  <a
                    href={e.mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal underline"
                  >
                    Ver mapa
                  </a>
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
        {e.precioDesde ? (
          <div className="flex gap-6 py-3.5">
            <dt className="label w-24 shrink-0 text-faint">Precio</dt>
            <dd className="tnum text-sm font-semibold text-ink">{e.precioDesde}</dd>
          </div>
        ) : null}
        {e.organizador ? (
          <div className="flex gap-6 py-3.5">
            <dt className="label w-24 shrink-0 text-faint">Organiza</dt>
            <dd className="text-sm font-semibold text-ink">{e.organizador}</dd>
          </div>
        ) : null}
      </dl>

      {/* ── CTA entradas ── */}
      {e.enlace && !pasado ? (
        <a
          href={e.enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover sm:w-auto"
        >
          Comprar entradas
          <ArrowRightIcon width={18} height={18} />
        </a>
      ) : null}
      {pasado ? (
        <p className="label mt-6 border-y border-rule py-3 text-faint">
          Este evento ya pasó.
        </p>
      ) : null}

      {/* ── Detalle largo ── */}
      {e.cuerpo?.length ? (
        <div className="prose-editorial measure mt-8 leading-relaxed text-ink/90">
          <PortableText value={e.cuerpo} />
        </div>
      ) : null}

      {/* ── Relacionados ── */}
      {relacionados.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-baseline gap-3 border-b border-ink pb-2">
            <h2 className="label text-ink">También en {v?.name}</h2>
            <Link href="/agenda" className="ulink ml-auto text-[12px] font-medium text-muted">
              Agenda completa
            </Link>
          </div>
          <WeekIndex items={relacionados} />
        </section>
      ) : null}
    </article>
  );
}
