import type { Metadata } from "next";
import Link from "next/link";
import { getDinamicasAbiertas } from "@/lib/sanity/dinamica";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dinámicas",
  description:
    "Participá gratis en las dinámicas de SeViveLa y ganate experiencias, cenas y planes en Costa Rica.",
  alternates: { canonical: "/dinamicas" },
};

export default async function DinamicasPage() {
  const dinamicas = await getDinamicasAbiertas();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Participá gratis</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Dinámicas</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Premios reales de marcas aliadas: experiencias, cenas y escapadas.
          Participar nunca cuesta nada.
        </p>
      </header>

      {dinamicas.length === 0 ? (
        /* ── Estado vacío ── */
        <div className="py-16 text-center md:py-24">
          <p className="label text-faint">Por ahora nada abierto</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            No hay dinámicas activas en este momento.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Suscribite al boletín y te avisamos apenas abra la próxima.
          </p>
          <Link
            href="/"
            className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Volver a la portada
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
          {dinamicas.map((d) => (
            <article key={d.id}>
              <Link href={`/dinamicas/${d.slug}`} className="imgzoom block">
                <EditorialImage src={d.imagen} alt={d.imagenAlt ?? d.title} ratio="3 / 2" />
              </Link>
              <div className="pt-3.5">
                <CategoryLabel vertical={d.vertical} />
                <Link href={`/dinamicas/${d.slug}`} className="mt-2 block">
                  <h2 className="text-xl font-bold tracking-tight leading-snug text-ink transition-colors hover:text-brand">
                    {d.title}
                  </h2>
                </Link>
                <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-muted">
                  {d.premio}
                </p>
                {d.patrocinado && d.marca ? (
                  <p className="label mt-2.5 text-faint">
                    Patrocinado · {d.marca}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
