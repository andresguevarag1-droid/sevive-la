import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { getEvento, getEventosRelacionados } from "@/lib/sanity/evento";
import { getVertical, site } from "@/lib/site";
import { CategoryLabel } from "@/components/kicker";
import { WeekIndex } from "@/components/week-index";
import { FavoritoButton } from "@/components/evento/favorito-button";
import { BotonesCalendario } from "@/components/evento/botones-calendario";
import { InteresEvento } from "@/components/evento/interes-evento";
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

/** "Desde ₡41.700" → { price: "41700", priceCurrency: "CRC" } (null si no hay dato). */
function parsePrecio(p?: string): { price: string; priceCurrency: string } | null {
  if (!p) return null;
  if (/gratis|gratuito|entrada libre/i.test(p)) return { price: "0", priceCurrency: "CRC" };
  const m = p.match(/([₡$])\s*([\d.,]+)/);
  if (!m) return null;
  const priceCurrency = m[1] === "$" ? "USD" : "CRC";
  // Formato CR: punto de miles, coma decimal.
  const valor = Number(m[2].replace(/\./g, "").replace(/,/g, "."));
  if (!Number.isFinite(valor)) return null;
  return { price: String(valor), priceCurrency };
}

/** Description de 140–160 caracteres para buscadores (única por evento). */
function metaDescription(e: {
  title: string;
  lugar?: string;
  inicio: string;
  horaPorConfirmar?: boolean;
  descripcion?: string;
}): string {
  const fecha = fmtLargo(e.inicio, !e.horaPorConfirmar);
  const base = `${e.title}${e.lugar ? ` en ${e.lugar}` : ""} — ${fecha}.`;
  const extra = e.descripcion
    ? ` ${e.descripcion}`
    : " Entradas, horario, ubicación y detalles verificados.";
  const cierre = " Agenda curada de SeViveLa.";
  let out = base + extra;
  if (out.length + cierre.length <= 170) out += cierre;
  return out.length > 170 ? `${out.slice(0, 167).trimEnd()}…` : out;
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
  const description = metaDescription(e);
  return {
    title: `${e.title} — ${fecha}`,
    description,
    // La og:image la genera ./opengraph-image.tsx (tarjeta por evento).
    openGraph: { title: e.title, description },
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
      {/* Datos estructurados: Event completo + migas + speakable (SEO local + GEO) */}
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
          inLanguage: site.locale,
          // Siempre hay imagen: la foto del evento o la tarjeta og generada.
          image: e.imagen ?? `${site.url}/agenda/${e.slug}/opengraph-image`,
          performer: e.artista
            ? { "@type": "PerformingGroup", name: e.artista }
            : undefined,
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
                ...(parsePrecio(e.precioDesde) ?? {}),
                availability: pasado
                  ? "https://schema.org/SoldOut"
                  : "https://schema.org/InStock",
              }
            : undefined,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: site.url },
            { "@type": "ListItem", position: 2, name: "Agenda", item: `${site.url}/agenda` },
            { "@type": "ListItem", position: 3, name: e.title },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${site.url}/agenda/${e.slug}`,
          inLanguage: site.locale,
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "article header p"],
          },
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
        /* El arte del evento (flyer/afiche) se muestra COMPLETO, sin recorte:
           proporción natural con tope de altura. */
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.imagen}
            alt={e.imagenAlt ?? e.title}
            fetchPriority="high"
            decoding="async"
            className="mx-auto max-h-[75vh] w-auto max-w-full rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]"
          />
        </figure>
      ) : null}

      {/* ── Ficha: cuándo, dónde, cuánto ── */}
      <dl className="mt-6 divide-y divide-rule border-y border-rule">
        <div className="flex gap-6 py-3.5">
          <dt className="label w-24 shrink-0 text-faint">Cuándo</dt>
          <dd className="tnum text-sm font-semibold text-ink">
            {esRango ? (
              <>
                Del{" "}
                <time dateTime={e.inicio}>{fmtLargo(e.inicio, false).toLowerCase()}</time>{" "}
                al <time dateTime={e.fin}>{fmtLargo(e.fin!, false).toLowerCase()}</time>
              </>
            ) : (
              <time dateTime={e.inicio}>{fmtLargo(e.inicio, conHora)}</time>
            )}
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
        {e.artista ? (
          <div className="flex gap-6 py-3.5">
            <dt className="label w-24 shrink-0 text-faint">Artista</dt>
            <dd className="text-sm font-semibold text-ink">{e.artista}</dd>
          </div>
        ) : null}
        {e.organizador ? (
          <div className="flex gap-6 py-3.5">
            <dt className="label w-24 shrink-0 text-faint">Organiza</dt>
            <dd className="text-sm font-semibold text-ink">{e.organizador}</dd>
          </div>
        ) : null}
      </dl>

      {/* ── Guardar + calendario (R3): señal de interés y razón para volver ── */}
      {!pasado ? (
        <div className="mt-6 flex flex-col gap-3">
          <FavoritoButton
            slug={e.slug}
            titulo={e.title}
            inicio={e.inicio}
            lugar={e.lugar}
            vertical={e.vertical}
          />
          <BotonesCalendario
            slug={e.slug}
            titulo={e.title}
            inicio={e.inicio}
            fin={e.fin}
            lugar={e.lugar}
          />
        </div>
      ) : null}

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
        /* Evento pasado → captura de interés para la próxima edición:
           leads segmentados por evento, monetizables ante el organizador. */
        <InteresEvento slug={e.slug} titulo={e.title} />
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
