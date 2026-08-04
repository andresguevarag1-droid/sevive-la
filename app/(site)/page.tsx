import type { Metadata } from "next";
import Link from "next/link";
import { getHomeContent } from "@/lib/sanity/queries";
import { getCampanaActiva } from "@/lib/sanity/campana";
import { HeroCampana } from "@/components/campana/hero-campana";
import { LeadStory } from "@/components/lead-story";
import { SectionHead } from "@/components/section-head";
import { WeekIndex } from "@/components/week-index";
import { VerticalIndex } from "@/components/vertical-index";
import { StoryCard } from "@/components/story-card";
import { VideoRow } from "@/components/video-row";
import { Beneficios } from "@/components/beneficios";
import { SubscribeEditorial } from "@/components/subscribe-editorial";
import { SearchIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const quickFilters = [
  { label: "Hoy", href: "/agenda?f=hoy" },
  { label: "Este fin de semana", href: "/agenda?f=finde" },
  { label: "Agenda completa", href: "/agenda" },
  { label: "Dinámicas", href: "/dinamicas" },
];

export default async function HomePage() {
  // Contenido desde Sanity (con fallback a mock por sección) + campaña activa.
  const [{ lead, week, features, videos, beneficios }, campana] =
    await Promise.all([getHomeContent(), getCampanaActiva()]);

  // Eventos reales del índice → datos estructurados de la portada (SEO/GEO).
  const eventosLd = week.filter((s) => s.fechaIso && s.href);

  // Numeración editorial continua: las secciones vacías se ocultan y las
  // visibles se numeran en orden (01, 02…), sin huecos.
  let contadorSeccion = 0;
  const num = () => String(++contadorSeccion).padStart(2, "0");

  return (
    <>
      {eventosLd.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Próximos días en Costa Rica",
            inLanguage: site.locale,
            itemListElement: eventosLd.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Event",
                name: s.title,
                startDate: s.fechaIso,
                url: `${site.url}${s.href}`,
              },
            })),
          }}
        />
      ) : null}

      {/* ── HERO de campaña (solo si el equipo la activó en el Studio) ── */}
      {campana ? <HeroCampana campana={campana} /> : null}

      {/* ── Barra de servicio: búsqueda + filtros rápidos ── */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
          <form action="/buscar" className="flex max-w-md flex-1 items-center gap-2">
            <SearchIcon width={18} height={18} className="shrink-0 text-faint" />
            <input
              name="q"
              type="search"
              placeholder="Buscar qué hacer, dónde comer, a dónde ir…"
              aria-label="Buscar"
              className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
            />
          </form>
          <nav className="hidden shrink-0 items-center gap-3 text-[13px] text-muted md:flex">
            {quickFilters.map((f, i) => (
              <span key={f.href} className="flex items-center gap-3">
                <Link href={f.href} className="ulink hover:text-ink">
                  {f.label}
                </Link>
                {i < quickFilters.length - 1 ? (
                  <span className="text-rule">·</span>
                ) : null}
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Nota líder (h2 si el h1 lo lleva la campaña; oculta si no hay) ── */}
      {lead ? (
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 md:pt-12 md:pb-16">
          <LeadStory story={lead} as={campana ? "h2" : "h1"} />
        </section>
      ) : null}

      {/* ── Próximos días ── */}
      {week.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <SectionHead index={num()} label="Próximos días" href="/agenda" action="Agenda completa" />
          <WeekIndex items={week} />
        </section>
      ) : null}

      {/* ── Secciones (banda lila de marca) ── */}
      <section style={{ background: "var(--color-paper-2)" }}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <SectionHead index={num()} label="Secciones" />
          <VerticalIndex />
        </div>
      </section>

      {/* ── Destacado ── */}
      {features.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <SectionHead index={num()} label="Destacado" href="/cultura" action="Más notas" />
          <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
            {features.map((s) => (
              <div key={s.id} data-reveal>
                <StoryCard story={s} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── En video (banda de tinta: las miniaturas mandan) ── */}
      {videos.length > 0 ? (
        <section style={{ background: "var(--color-ink)" }}>
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <SectionHead index={num()} label="En video" href="/videos" action="Videoteca" tone="dark" />
            <VideoRow items={videos} />
          </div>
        </section>
      ) : null}

      {/* ── Beneficios ── */}
      {beneficios.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <SectionHead index={num()} label="Beneficios" href="/promociones" action="Todas las promos" />
          <Beneficios items={beneficios} />
        </section>
      ) : null}

      {/* ── Boletín ── */}
      <SubscribeEditorial />
    </>
  );
}
