import Link from "next/link";
import { verticals, site } from "@/lib/site";
import {
  pasandoAhora,
  videos,
  editorial,
  promos,
} from "@/lib/content";
import { VerticalCard } from "@/components/vertical-card";
import { PosterCard } from "@/components/poster-card";
import { VideoCard } from "@/components/video-card";
import { PromoCard } from "@/components/promo-card";
import { EditorialFeature } from "@/components/editorial-feature";
import { AgendaWeek } from "@/components/agenda-week";
import { SubscribeBlock } from "@/components/subscribe-block";
import { Section, SectionHeader } from "@/components/section";
import { SearchIcon } from "@/components/icons";

const quickChips = [
  { label: "Hoy", href: "/agenda/hoy" },
  { label: "Este fin de semana", href: "/agenda/fin-de-semana" },
  { label: "Gratis", href: "/agenda/gratis" },
  { label: "Cerca de mí", href: "/agenda" },
];

export default function HomePage() {
  return (
    <>
      {/* ─────────────── HERO EDITORIAL ─────────────── */}
      <section className="relative isolate overflow-hidden px-4 pt-24 pb-10 md:pt-32 md:pb-14">
        {/* tinte de marca sutil sobre papel — mantiene el aire claro */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(90% 60% at 100% 0%, color-mix(in srgb, var(--color-brand-bright) 12%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 0% 0%, color-mix(in srgb, var(--color-petrol) 10%, transparent) 0%, transparent 55%)",
          }}
        />

        <div className="mx-auto max-w-3xl">
          <p className="kicker reveal mb-4 text-brand">
            Guía viva de Costa Rica
          </p>

          <h1 className="reveal text-[clamp(2.7rem,11vw,5.5rem)] font-black leading-[0.94] tracking-tight text-ink">
            Descubrí qué{" "}
            <span className="serif-italic font-medium text-brand">vivir</span>{" "}
            hoy.
          </h1>

          <p className="reveal mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: "60ms" }}>
            La plataforma donde la gente encuentra qué hacer, dónde comer, a
            dónde ir y qué se está viviendo en la región.
          </p>

          {/* Buscador prominente */}
          <form
            action="/buscar"
            className="reveal mt-7 flex items-center gap-2 rounded-[var(--radius-full)] border border-line bg-surface p-2 pl-5 shadow-[0_10px_30px_-18px_rgba(20,18,26,0.4)]"
            style={{ animationDelay: "120ms" }}
          >
            <SearchIcon className="shrink-0 text-muted" width={22} height={22} />
            <input
              name="q"
              type="search"
              placeholder="¿Qué querés vivir hoy?"
              aria-label="Buscar experiencias, lugares o eventos"
              className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="pressable shrink-0 rounded-[var(--radius-full)] bg-brand px-5 py-2.5 font-semibold text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Buscar
            </button>
          </form>

          <div className="rail reveal mt-4 -mx-4 px-4 md:mx-0 md:flex-wrap md:px-0" style={{ animationDelay: "180ms" }}>
            {quickChips.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="pressable rounded-[var(--radius-full)] border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── PASANDO AHORA ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Pasando ahora"
          title="Lo que no te podés perder"
          href="/agenda/hoy"
        />
        <div className="rail -mx-4 px-4 md:mx-0 md:px-0">
          {pasandoAhora.map((item) => (
            <PosterCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      {/* ─────────────── NAVEGADOR DE VERTICALES ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Explorá por interés"
          title="Seis mundos, una plataforma"
          accent="var(--color-cultura)"
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {verticals.map((v) => (
            <VerticalCard key={v.slug} vertical={v} />
          ))}
        </div>
      </Section>

      {/* ─────────────── AGENDA DE LA SEMANA ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Agenda"
          title="Tu semana en un vistazo"
          href="/agenda"
          accent="var(--color-turismo)"
        />
        <AgendaWeek />
      </Section>

      {/* ─────────────── VIDEOS Y REELS ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Videos y reels"
          title="Mirá la región"
          href="/videos"
          accent="var(--color-experiencias)"
        />
        <div className="rail -mx-4 px-4 md:mx-0 md:px-0">
          {videos.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      {/* ─────────────── EDITORIAL DESTACADO ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Editorial"
          title="Para leer con calma"
          href="/cultura"
          accent="var(--color-gastronomia)"
        />
        <EditorialFeature items={editorial} />
      </Section>

      {/* ─────────────── PROMOCIONES ─────────────── */}
      <Section>
        <SectionHeader
          kicker="Beneficios"
          title="Promos de marcas aliadas"
          href="/promociones"
          accent="var(--color-entretenimiento)"
        />
        <div className="rail -mx-4 px-4 md:mx-0 md:px-0">
          {promos.map((item) => (
            <PromoCard key={item.id} item={item} />
          ))}
        </div>
      </Section>

      {/* ─────────────── SUSCRIPCIÓN ─────────────── */}
      <SubscribeBlock />

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="border-t border-line px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <p className="text-xl font-extrabold text-ink">{site.name}</p>
            <p className="mt-2 text-sm text-muted">
              Descubrí, viví y compartí lo mejor de la región.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-sm font-medium text-muted">
            {verticals.map((v) => (
              <Link
                key={v.slug}
                href={`/${v.slug}`}
                className="transition-colors hover:text-ink"
              >
                {v.name}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-muted">
          © {new Date().getFullYear()} {site.name} · Hecho en Costa Rica
        </p>
      </footer>
    </>
  );
}
