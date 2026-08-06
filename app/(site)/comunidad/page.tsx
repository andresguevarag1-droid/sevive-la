import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comunidad",
  description:
    "La comunidad de SeViveLa: dinámicas, boletín y muy pronto perfiles y favoritos.",
  alternates: { canonical: "/comunidad" },
};

export default function ComunidadPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Sé parte</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Comunidad</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Guardá tus planes en Mi agenda, respaldalos por correo y recibí el boletín. Mientras
          tanto, estas son las dos mejores formas de ser parte:
        </p>
      </header>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link href="/dinamicas" className="card pressable block px-6 py-8">
          <p className="label text-brand">Dinámicas</p>
          <h2 className="mt-2 text-2xl">Participá y ganate un plan.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Cenas, experiencias y escapadas de marcas aliadas. Participar es
            gratis, siempre.
          </p>
        </Link>
        <Link href="/#boletin" className="card pressable block px-6 py-8">
          <p className="label text-brand">Boletín</p>
          <h2 className="mt-2 text-2xl">Los planes del finde, cada jueves.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Curado por la redacción, sin relleno. Date de baja cuando quieras.
          </p>
        </Link>
      </div>
    </section>
  );
}
