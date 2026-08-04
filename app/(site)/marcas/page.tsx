import type { Metadata } from "next";
import { site, verticalsVisibles } from "@/lib/site";

export const metadata: Metadata = {
  title: "Para marcas",
  description:
    "Conectá tu marca con audiencias reales en Costa Rica: contenido patrocinado, dinámicas y beneficios segmentados por interés.",
  alternates: { canonical: "/marcas" },
};

const formatos = [
  {
    title: "Dinámicas / giveaways",
    body: "Tu premio, nuestra audiencia: leads cualificados con consentimiento explícito, segmentados por vertical de interés.",
  },
  {
    title: "Contenido patrocinado",
    body: "Crónicas, videos y guías con la voz editorial de SeViveLa, siempre etiquetados con transparencia.",
  },
  {
    title: "Beneficios",
    body: "Tu descuento frente a personas que ya buscan dónde comer, qué hacer y a dónde ir.",
  },
  {
    title: "Boletín",
    body: "Presencia en el correo semanal que la audiencia abre para planear su fin de semana.",
  },
];

export default function MarcasPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Para marcas</p>
        <h1 className="mt-2 max-w-3xl text-[clamp(2.2rem,6vw,4rem)]">
          Audiencias reales, con intereses declarados.
        </h1>
        <p className="measure mt-4 leading-relaxed text-muted">
          {site.name} conecta a tu marca con personas en Costa Rica que ya
          están decidiendo qué vivir: dónde comer, qué evento ir a ver, a dónde
          escaparse. Datos primarios con consentimiento, segmentados por seis
          verticales de interés.
        </p>
      </header>

      {/* ── Verticales como mapa de segmentación ── */}
      <div className="mt-10 flex flex-wrap gap-2">
        {verticalsVisibles.map((v) => (
          <span
            key={v.slug}
            className="chip border"
            style={{ borderColor: "var(--color-rule)", color: v.colorVar }}
          >
            {v.name}
          </span>
        ))}
      </div>

      {/* ── Formatos ── */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {formatos.map((f) => (
          <div key={f.title} className="card px-6 py-8">
            <h2 className="text-xl font-bold tracking-tight text-ink">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </div>

      {/* ── Contacto ── */}
      <div className="mt-12 border-t border-ink pt-8">
        <h2 className="text-2xl">Conversemos.</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Contanos qué querés lograr y armamos la propuesta.
        </p>
        <a
          href={`mailto:hola@${site.domain}?subject=Quiero%20pautar%20con%20SeViveLa`}
          className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Escribir a hola@{site.domain}
        </a>
      </div>
    </section>
  );
}
