import type { Metadata } from "next";
import Link from "next/link";
import { buscarContenido } from "@/lib/sanity/listados";
import { verticals } from "@/lib/site";
import { StoryCard } from "@/components/story-card";
import { SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Buscar",
  description:
    "Buscá qué hacer, dónde comer y a dónde ir en Costa Rica dentro de SeViveLa.",
  robots: { index: false },
  alternates: { canonical: "/buscar" },
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const resultados = query.length >= 2 ? await buscarContenido(query) : [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Explorar</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Buscar</h1>
      </header>

      {/* ── Formulario (GET nativo: cero JS) ── */}
      <form action="/buscar" className="mt-6 flex max-w-xl items-center gap-3 border-b border-ink pb-3">
        <SearchIcon width={20} height={20} className="shrink-0 text-faint" />
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Qué hacer, dónde comer, a dónde ir…"
          aria-label="Buscar en SeViveLa"
          autoFocus={!query}
          className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          className="pressable shrink-0 bg-brand px-4 py-2 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Buscar
        </button>
      </form>

      {query.length === 0 ? (
        /* ── Sin consulta: sugerir las secciones ── */
        <div className="mt-10">
          <p className="label text-faint">O explorá por sección</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {verticals.map((v) => (
              <Link
                key={v.slug}
                href={`/${v.slug}`}
                className="chip pressable border"
                style={{ borderColor: "var(--color-rule)", color: v.colorVar }}
              >
                {v.name}
              </Link>
            ))}
          </div>
        </div>
      ) : query.length < 2 ? (
        <p className="mt-10 text-sm text-muted">
          Escribí al menos dos letras para buscar.
        </p>
      ) : resultados.length === 0 ? (
        /* ── Sin resultados ── */
        <div className="mt-12 max-w-md">
          <p className="label text-faint">Sin resultados</p>
          <h2 className="mt-2 text-2xl">
            Nada para “{query}” (todavía).
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Probá con otra palabra, o explorá las secciones: seguro hay un plan
            esperándote.
          </p>
        </div>
      ) : (
        <>
          <p className="label mt-10 text-faint" aria-live="polite">
            {resultados.length} resultado{resultados.length === 1 ? "" : "s"} para “{query}”
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {resultados.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
