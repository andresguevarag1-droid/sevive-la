import type { Metadata } from "next";
import Link from "next/link";
import { getHomeContent } from "@/lib/sanity/queries";
import { LeadStory } from "@/components/lead-story";
import { SectionHead } from "@/components/section-head";
import { WeekIndex } from "@/components/week-index";
import { VerticalIndex } from "@/components/vertical-index";
import { StoryCard } from "@/components/story-card";
import { VideoRow } from "@/components/video-row";
import { Beneficios } from "@/components/beneficios";
import { SubscribeEditorial } from "@/components/subscribe-editorial";
import { SearchIcon } from "@/components/icons";

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
  // Contenido desde Sanity (con fallback a mock por sección).
  const { lead, week, features, videos, beneficios } = await getHomeContent();

  return (
    <>
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
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
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

      {/* ── Nota líder ── */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 md:pt-12 md:pb-16">
        <LeadStory story={lead} />
      </section>

      {/* ── Esta semana ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHead index="01" label="Esta semana" href="/agenda" action="Agenda completa" />
        <WeekIndex items={week} />
      </section>

      {/* ── Secciones (banda lila de marca) ── */}
      <section style={{ background: "var(--color-paper-2)" }}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <SectionHead index="02" label="Secciones" />
          <VerticalIndex />
        </div>
      </section>

      {/* ── Destacado ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHead index="03" label="Destacado" href="/cultura" action="Más notas" />
        <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
          {features.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>

      {/* ── En video ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHead index="04" label="En video" href="/videos" action="Videoteca" />
        <VideoRow items={videos} />
      </section>

      {/* ── Beneficios ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <SectionHead index="05" label="Beneficios" href="/promociones" action="Todas las promos" />
        <Beneficios items={beneficios} />
      </section>

      {/* ── Boletín ── */}
      <SubscribeEditorial />
    </>
  );
}
