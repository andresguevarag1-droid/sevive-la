import Link from "next/link";
import { verticals, site } from "@/lib/site";
import { VerticalCard } from "@/components/vertical-card";
import { SearchIcon } from "@/components/icons";

// Chips de acceso rápido del hero — comunican "plataforma", no "revista".
const quickChips = [
  { label: "Hoy", href: "/agenda/hoy" },
  { label: "Este fin de semana", href: "/agenda/fin-de-semana" },
  { label: "Gratis", href: "/agenda/gratis" },
  { label: "Cerca de mí", href: "/agenda" },
];

export default function HomePage() {
  return (
    <>
      {/* ─────────────── HERO CINEMATOGRÁFICO ─────────────── */}
      <section className="relative isolate overflow-hidden px-4 pt-28 pb-14 md:pt-40 md:pb-20">
        {/* gradiente de marca: morado/petróleo como estructura (nunca texto) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 90% at 15% 0%, var(--color-deep-purple) 0%, transparent 55%), radial-gradient(120% 90% at 100% 20%, var(--color-petrol) 0%, transparent 50%), var(--color-canvas)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-24 left-1/2 -z-10 h-72 w-[120%] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--color-brand)" }}
        />

        <div className="mx-auto max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Cultura, planes y experiencias en Costa Rica
          </p>

          <h1 className="text-[clamp(2.6rem,11vw,5.5rem)] font-black leading-[0.95] tracking-tight text-ink">
            Descubrí qué
            <br />
            <span className="text-brand">vivir</span> hoy.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-muted">
            {site.name} es la plataforma donde la gente encuentra qué hacer,
            dónde comer, a dónde ir y qué se está viviendo en la región.
          </p>

          {/* Buscador prominente — comunica "plataforma" */}
          <form
            action="/buscar"
            className="mt-7 flex items-center gap-2 rounded-[var(--radius-full)] border border-line bg-surface/80 p-2 pl-5 backdrop-blur"
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
              className="shrink-0 rounded-[var(--radius-full)] bg-brand px-5 py-2.5 font-semibold text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Buscar
            </button>
          </form>

          {/* Chips de acceso rápido */}
          <div className="rail mt-4 -mx-4 px-4 md:mx-0 md:flex-wrap md:px-0">
            {quickChips.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="rounded-[var(--radius-full)] border border-line bg-surface/60 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── NAVEGADOR DE VERTICALES ─────────────── */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-ink md:text-3xl">
                Explorá por interés
              </h2>
              <p className="mt-1 text-sm text-muted">
                Seis mundos, una sola plataforma.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {verticals.map((v) => (
              <VerticalCard key={v.slug} vertical={v} />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── AVISO DE CONSTRUCCIÓN (temporal) ─────────────── */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-[var(--radius-lg)] border border-line bg-surface p-6 text-sm text-muted">
          <p className="font-semibold text-ink">Estamos construyendo.</p>
          <p className="mt-1">
            Sistema de diseño base en marcha. Próximo: rails de contenido,
            agenda, videoteca y comunidad.
          </p>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="border-t border-line px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-extrabold text-ink">{site.name}</p>
            <p className="mt-1 max-w-xs text-sm text-muted">{site.tagline}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-muted">
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
        <p className="mx-auto mt-8 max-w-6xl text-xs text-muted">
          © {new Date().getFullYear()} {site.name} · Hecho en Costa Rica
        </p>
      </footer>
    </>
  );
}
