import type { Metadata } from "next";
import { getBeneficiosTodos } from "@/lib/sanity/listados";
import { CategoryLabel } from "@/components/kicker";

export const metadata: Metadata = {
  title: "Beneficios",
  description:
    "Descuentos y beneficios de marcas aliadas de SeViveLa: restaurantes, tours y experiencias en Costa Rica.",
  alternates: { canonical: "/promociones" },
};

export const revalidate = 60;

export default async function PromocionesPage() {
  const beneficios = await getBeneficiosTodos();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Para vos</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Beneficios</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Descuentos y ventajas de marcas aliadas. El contenido patrocinado
          siempre está etiquetado.
        </p>
      </header>

      {beneficios.length === 0 ? (
        /* ── Estado vacío ── */
        <div className="py-16 text-center md:py-24">
          <p className="label text-faint">Muy pronto</p>
          <h2 className="mx-auto mt-3 max-w-lg text-2xl">
            Estamos cerrando los primeros beneficios con marcas aliadas.
          </h2>
        </div>
      ) : (
        <ul className="mt-8 border-t border-rule">
          {beneficios.map((b) => (
            <li key={b.id} className="border-b border-rule py-4">
              <div className="flex items-baseline justify-between gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryLabel vertical={b.vertical} />
                    {b.patrocinado ? (
                      <span className="label text-faint">Patrocinado</span>
                    ) : null}
                  </div>
                  {b.author ? (
                    <p className="label mt-2 text-faint">{b.author}</p>
                  ) : null}
                  <h2 className="mt-1 text-lg font-semibold tracking-tight leading-snug text-ink">
                    {b.title}
                  </h2>
                </div>
                <span className="label tnum shrink-0 text-brand">{b.meta}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
