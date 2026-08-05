import type { Metadata } from "next";
import { getBeneficiosTodos } from "@/lib/sanity/listados";
import { Beneficios } from "@/components/beneficios";

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
        <div className="mt-8">
          <Beneficios
            items={beneficios.map((b) => ({ ...b, sponsored: b.patrocinado }))}
            conVendedora
          />
        </div>
      )}
    </section>
  );
}
