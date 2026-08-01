import type { Metadata } from "next";
import Link from "next/link";
import { site, verticals } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "SeViveLa es la guía viva de experiencias, cultura y gastronomía de Costa Rica: qué vivir, contado por gente que lo vive.",
  alternates: { canonical: "/nosotros" },
};

export default function NosotrosPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Nosotros</p>
        <h1 className="mt-2 text-[clamp(2.2rem,6vw,3.6rem)]">
          {site.tagline}
        </h1>
      </header>

      <div className="prose-editorial measure mt-6 leading-relaxed text-ink/90">
        <p>
          <strong>{site.name}</strong> es una guía viva de lo que vale la pena
          vivir en Costa Rica: la feria que abre el sábado, la soda que hay que
          conocer, el concierto del que todos van a hablar, la escapada que
          cabe en un fin de semana.
        </p>
        <p>
          No somos un directorio ni un agregador: somos una redacción que sale,
          come, camina y baila lo que recomienda. Contamos el país en seis
          secciones — {verticals.map((v) => v.name.toLowerCase()).join(", ")} —
          y en los formatos donde la gente realmente descubre planes: crónicas,
          video vertical, agenda y beneficios.
        </p>
        <p>
          Trabajamos con marcas aliadas con una regla simple: el contenido
          pagado siempre se etiqueta, y los datos de nuestra comunidad se
          tratan con consentimiento explícito y todo el rigor de la ley
          costarricense.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/#boletin"
          className="pressable inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Suscribirme al boletín
        </Link>
        <Link
          href="/marcas"
          className="pressable inline-block border border-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-ink"
        >
          Soy una marca
        </Link>
      </div>
    </section>
  );
}
