import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { verticals, getVertical } from "@/lib/site";
import { getVerticalContent } from "@/lib/sanity/vertical-queries";
import { SectionHead } from "@/components/section-head";
import { StoryCard } from "@/components/story-card";
import { WeekIndex } from "@/components/week-index";
import { VideoRow } from "@/components/video-row";
import { Beneficios } from "@/components/beneficios";
import { EditorialImage } from "@/components/editorial-image";

type Params = { vertical: string };

/** Las 6 verticales se generan estáticas; cualquier otro slug es 404. */
export function generateStaticParams(): Params[] {
  return verticals.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) return {};
  return {
    title: `${v.name} · ${v.verb}`,
    description: v.blurb,
    openGraph: { title: v.name, description: v.blurb },
    alternates: { canonical: `/${v.slug}` },
  };
}

export default async function VerticalPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { vertical } = await params;
  const v = getVertical(vertical);
  if (!v) notFound();

  const { cronicas, eventos, reels, beneficios, lugares } =
    await getVerticalContent(v.slug);

  const [portada, ...resto] = cronicas;
  const sinContenido =
    !portada &&
    eventos.length === 0 &&
    reels.length === 0 &&
    beneficios.length === 0 &&
    lugares.length === 0;

  return (
    <>
      {/* ── Cabecera de la vertical: verbo + nombre con su color ── */}
      <header className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="label" style={{ color: v.colorVar }}>
            {v.verb}
          </p>
          <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">{v.name}</h1>
          <p className="measure mt-3 leading-relaxed text-muted">{v.blurb}</p>
        </div>
        {/* barra de identidad — color de la vertical como marca funcional */}
        <div className="h-1" style={{ background: v.colorVar }} aria-hidden />
      </header>

      {sinContenido ? (
        /* ── Estado vacío editorial ── */
        <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <p className="label text-faint">Muy pronto</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            Estamos preparando lo mejor de {v.name.toLowerCase()}.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            El equipo editorial está curando contenido para esta sección.
            Mientras tanto, explorá la portada.
          </p>
          <Link
            href="/"
            className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Volver a la portada
          </Link>
        </section>
      ) : (
        <>
          {/* ── Nota principal de la vertical ── */}
          {portada ? (
            <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 md:pt-12">
              <article className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
                <div className="imgzoom">
                  <EditorialImage
                    src={portada.img}
                    alt={portada.title}
                    ratio="4 / 3"
                    priority
                  />
                </div>
                <div>
                  <p className="label text-faint">{portada.meta}</p>
                  <h2 className="mt-2 text-[clamp(1.7rem,4vw,2.6rem)]">
                    {portada.title}
                  </h2>
                  {portada.dek ? (
                    <p className="measure mt-3 leading-relaxed text-muted">
                      {portada.dek}
                    </p>
                  ) : null}
                  {portada.author ? (
                    <p className="label mt-4 text-faint">{portada.author}</p>
                  ) : null}
                </div>
              </article>
            </section>
          ) : null}

          {/* ── Más notas ── */}
          {resto.length > 0 ? (
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
              <SectionHead index="01" label="Notas" />
              <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
                {resto.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Agenda de la vertical ── */}
          {eventos.length > 0 ? (
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
              <SectionHead
                index="02"
                label="Agenda"
                href="/agenda"
                action="Agenda completa"
              />
              <WeekIndex items={eventos} />
            </section>
          ) : null}

          {/* ── En video ── */}
          {reels.length > 0 ? (
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
              <SectionHead
                index="03"
                label="En video"
                href="/videos"
                action="Videoteca"
              />
              <VideoRow items={reels} />
            </section>
          ) : null}

          {/* ── Lugares ── */}
          {lugares.length > 0 ? (
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
              <SectionHead index="04" label="Lugares" />
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
                {lugares.map((l) => (
                  <article key={l.id}>
                    <EditorialImage src={l.img} alt={l.title} ratio="3 / 2" />
                    <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                      {l.title}
                    </h3>
                    {l.meta ? (
                      <p className="label mt-1 text-faint">{l.meta}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Beneficios de la vertical ── */}
          {beneficios.length > 0 ? (
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
              <SectionHead
                index="05"
                label="Beneficios"
                href="/promociones"
                action="Todas las promos"
              />
              <Beneficios items={beneficios} />
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
