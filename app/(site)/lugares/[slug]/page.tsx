import type { Metadata } from "next";
import { getSlugsDeTipo } from "@/lib/sanity/slugs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLugar, getEventosEnLugar } from "@/lib/sanity/lugar";
import { getVertical, site } from "@/lib/site";
import { CategoryLabel } from "@/components/kicker";
import { WeekIndex } from "@/components/week-index";
import { JsonLd } from "@/components/json-ld";

/**
 * Detalle de lugar — SEO local puro: cada restaurante, bar o destino con
 * página propia, datos estructurados Place y sus próximos eventos.
 */
export const revalidate = 300;

// Prerender de los slugs publicados; los nuevos caen a on-demand (ISR).
export async function generateStaticParams() {
  return getSlugsDeTipo("lugar");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = await getLugar(slug);
  if (!l) return {};
  const description =
    l.descripcion?.slice(0, 155) ??
    `${l.title}${l.ubicacion ? ` en ${l.ubicacion}` : ""} — descubrilo en ${site.name}.`;
  return {
    title: l.title,
    description,
    alternates: { canonical: `/lugares/${l.slug}` },
  };
}

export default async function LugarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = await getLugar(slug);
  if (!l) notFound();

  const v = getVertical(l.vertical);
  const eventos = await getEventosEnLugar(l.title);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Place",
          name: l.title,
          ...(l.descripcion ? { description: l.descripcion } : {}),
          ...(l.imagen ? { image: l.imagen } : {}),
          ...(l.mapsUrl ? { hasMap: l.mapsUrl } : {}),
          address: {
            "@type": "PostalAddress",
            ...(l.ubicacion ? { streetAddress: l.ubicacion } : {}),
            addressCountry: "CR",
          },
          url: `${site.url}/lugares/${l.slug}`,
        }}
      />

      {/* ── Breadcrumb ── */}
      <nav aria-label="Ruta" className="label text-faint">
        <Link href={`/${l.vertical}`} className="ulink hover:text-ink">
          {v?.name}
        </Link>{" "}
        <span aria-hidden>›</span> Lugares
      </nav>

      {/* ── Cabecera ── */}
      <header className="mt-4">
        <CategoryLabel vertical={l.vertical} type="lugar" />
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.4rem)] leading-[1.02]">{l.title}</h1>
        {l.ubicacion ? (
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {l.ubicacion}
          </p>
        ) : null}
      </header>

      {l.imagen ? (
        <figure className="mt-6 overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.imagen}
            alt={l.imagenAlt ?? l.title}
            fetchPriority="high"
            decoding="async"
            className="w-full object-cover"
            style={{ aspectRatio: "3 / 2" }}
          />
        </figure>
      ) : null}

      {l.descripcion ? (
        <p className="measure mt-6 text-lg leading-relaxed text-ink/90">{l.descripcion}</p>
      ) : null}

      {l.mapsUrl ? (
        <a
          href={l.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-6 inline-flex min-h-12 items-center justify-center gap-2 border-2 border-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Cómo llegar (Google Maps)
        </a>
      ) : null}

      {/* ── Próximos eventos en este lugar ── */}
      {eventos.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-baseline gap-3 border-b border-ink pb-2">
            <h2 className="label text-ink">Próximamente aquí</h2>
            <Link href="/agenda" className="ulink ml-auto text-[12px] font-medium text-muted">
              Agenda completa
            </Link>
          </div>
          <div className="mt-4">
            <WeekIndex items={eventos} />
          </div>
        </section>
      ) : null}
    </article>
  );
}
