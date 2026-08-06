import type { Metadata } from "next";
import { getSlugsDeTipo } from "@/lib/sanity/slugs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { getCronica, getCronicasRelacionadas } from "@/lib/sanity/cronica";
import { urlForImage } from "@/sanity/lib/image";
import { getVertical, site } from "@/lib/site";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";
import { StoryCard } from "@/components/story-card";
import { JsonLd } from "@/components/json-ld";
import { Compartir } from "@/components/compartir";
import { TrackClicks } from "@/components/track-clicks";
import { ProgresoLectura } from "@/components/cronica/progreso-lectura";
import { SeguiExplorando } from "@/components/cronica/segui-explorando";
import { InteresEvento } from "@/components/evento/interes-evento";

type Params = { slug: string };

export const revalidate = 300;

// Prerender de los slugs publicados; los nuevos caen a on-demand (ISR).
export async function generateStaticParams() {
  return getSlugsDeTipo("cronica");
}

/** "3 de agosto de 2026" en hora de Costa Rica. */
function fmtFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  }).format(d);
}

/** Description de 140–160 caracteres, única por nota. */
function metaDescription(c: { title: string; bajada?: string; autor?: string }): string {
  const base = c.bajada ?? c.title;
  const cierre = ` ${c.autor ? `Por ${c.autor} en` : "En"} SeViveLa, la guía viva de Costa Rica.`;
  const out = base.length + cierre.length <= 170 ? base + cierre : base;
  return out.length > 170 ? `${out.slice(0, 167).trimEnd()}…` : out;
}

// Cuerpo con imágenes intercaladas (el esquema las permite dentro de `cuerpo`).
const componentesCuerpo: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const src = urlForImage(value, 1400);
      if (!src) return null;
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={(value as { alt?: string }).alt ?? ""}
            loading="lazy"
            decoding="async"
            className="w-full rounded-[var(--radius-lg)]"
          />
          {(value as { alt?: string }).alt ? (
            <figcaption className="label mt-2 text-faint">
              {(value as { alt?: string }).alt}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCronica(slug);
  if (!c) return {};
  const description = metaDescription(c);
  return {
    title: c.title,
    description,
    openGraph: {
      type: "article",
      title: c.title,
      description,
      // Solo declarar images cuando HAY imagen (declararla undefined
      // bloquea la og:image por defecto del sitio).
      ...(c.imagen ? { images: [{ url: c.imagen }] } : {}),
    },
    alternates: { canonical: `/cronica/${c.slug}` },
  };
}

export default async function CronicaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const c = await getCronica(slug);
  if (!c) notFound();

  const v = getVertical(c.vertical);
  const relacionadas = await getCronicasRelacionadas(c.vertical, c.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <ProgresoLectura />
      {/* Datos estructurados: Article + migas + speakable (SEO/GEO) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: c.title,
          description: c.bajada,
          datePublished: c.fecha,
          inLanguage: site.locale,
          image: c.imagen,
          articleSection: v?.name,
          author: {
            "@type": c.autor?.startsWith("Redacción") ? "Organization" : "Person",
            name: c.autor ?? site.name,
          },
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
            logo: { "@type": "ImageObject", url: `${site.url}/logo.svg` },
          },
          mainEntityOfPage: `${site.url}/cronica/${c.slug}`,
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "article header p"],
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: site.url },
            ...(v
              ? [
                  {
                    "@type": "ListItem" as const,
                    position: 2,
                    name: v.name,
                    item: `${site.url}/${v.slug}`,
                  },
                ]
              : []),
            { "@type": "ListItem", position: v ? 3 : 2, name: c.title },
          ],
        }}
      />

      {/* ── Breadcrumb visible ── */}
      <nav aria-label="Ruta" className="label text-faint">
        <Link href={v ? `/${v.slug}` : "/"} className="ulink hover:text-ink">
          {v?.name ?? "Portada"}
        </Link>{" "}
        <span aria-hidden>›</span> {c.formato ?? "Crónica"}
      </nav>

      {/* ── Cabecera ── */}
      <header className="mt-4">
        <CategoryLabel vertical={c.vertical} />
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.4rem)] leading-[1.02]">{c.title}</h1>
        {c.bajada ? (
          <p className="measure mt-3 text-lg leading-relaxed text-muted">{c.bajada}</p>
        ) : null}
        <p className="label mt-4 flex flex-wrap items-center gap-x-2 text-faint">
          {c.autor ? <span className="text-ink">{c.autor}</span> : null}
          {c.autor ? <span aria-hidden>·</span> : null}
          <time dateTime={c.fecha}>{fmtFecha(c.fecha)}</time>
          {c.lecturaMin ? (
            <>
              <span aria-hidden>·</span>
              <span className="tnum">{c.lecturaMin} min de lectura</span>
            </>
          ) : null}
        </p>
      </header>

      {c.imagen ? (
        <figure className="mt-6">
          <EditorialImage src={c.imagen} alt={c.imagenAlt ?? c.title} ratio="16 / 9" priority />
        </figure>
      ) : null}

      {/* ── Cuerpo ── */}
      {c.cuerpo?.length ? (
        <div className="prose-editorial capitular measure mt-8 text-[1.02rem] leading-relaxed text-ink/90">
          <PortableText value={c.cuerpo} components={componentesCuerpo} />
        </div>
      ) : null}

      <Compartir titulo={c.title} />

      {/* ── Cobertura de un evento que ya pasó → captura de interés en la
           próxima edición (leads segmentados por evento). ── */}
      {c.formato === "Cobertura" ? (
        <InteresEvento
          slug={c.slug}
          titulo={c.title.split(":")[0].trim()}
          variante="cronica"
        />
      ) : null}

      {/* ── Seguí explorando: la sesión no muere aquí. El evento se elige
           por afinidad con la nota (Miss Grand → evento de Miss Grand). ── */}
      <SeguiExplorando titulo={c.title} bajada={c.bajada} vertical={c.vertical} />

      {/* ── Seguí leyendo ── */}
      {relacionadas.length > 0 ? (
        <TrackClicks module="cronica_segui_leyendo">
        <section className="mt-14">
          <div className="flex items-baseline gap-3 border-b border-ink pb-2">
            <h2 className="label text-ink">Seguí leyendo</h2>
            {v ? (
              <Link
                href={`/${v.slug}`}
                className="ulink ml-auto text-[12px] font-medium text-muted"
              >
                Más de {v.name}
              </Link>
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
            {relacionadas.map((s) => (
              <div key={s.id} data-reveal>
                <StoryCard story={s} />
              </div>
            ))}
          </div>
        </section>
        </TrackClicks>
      ) : null}
    </article>
  );
}
