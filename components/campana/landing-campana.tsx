import Link from "next/link";
import type { Campana } from "@/lib/sanity/campana";
import { estadoCampana } from "@/lib/sanity/campana";
import { FormParticipacion } from "@/components/campana/form-participacion";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

/**
 * Landing de campaña (/dinamicas/<slug> cuando el slug es una campaña).
 * Cabecera festiva + premio + urgencia + formulario de captura + legales.
 */

type Utm = {
  source?: string;
  medium?: string;
  content?: string;
  campaign?: string;
};

/** Fecha legible es-CR: "12 de noviembre, 18:00". */
function fmtFecha(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(date);
}

function diasRestantes(iso: string): number | null {
  const fin = new Date(iso).getTime();
  if (Number.isNaN(fin)) return null;
  return Math.max(0, Math.ceil((fin - Date.now()) / 86400000));
}

export function CampanaLanding({
  campana,
  utm,
}: {
  campana: Campana;
  utm?: Utm;
}) {
  const estado = estadoCampana(campana);
  const dias = diasRestantes(campana.termina);

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: campana.subtitulo,
          description: `${campana.premio} Participar no cuesta nada. Válido solo para Costa Rica.`,
          url: `${site.url}/dinamicas/${campana.slug}`,
          inLanguage: site.locale,
          isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        }}
      />

      {/* ── Cabecera festiva (versión compacta del hero) ── */}
      <header
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #f7941d 0%, #ef4136 38%, #c71e70 72%, #7a1f6e 100%)",
        }}
      >
        <div className="mx-auto grid max-w-4xl items-center gap-6 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:py-12">
          <div>
            <span className="label inline-block rounded-full bg-lilac px-3.5 py-1.5 text-white">
              Dinámica · Participá gratis
            </span>
            <h1 className="mt-4 font-sans text-[clamp(2rem,6vw,3.4rem)] font-black uppercase leading-[0.95] tracking-tight text-white [text-wrap:balance]">
              {campana.titulo}
            </h1>
            <p className="mt-3 max-w-lg text-lg font-semibold leading-snug text-white/95">
              {campana.subtitulo}
            </p>
            {campana.patrocinado && campana.patrocinador ? (
              <p className="label mt-4 text-white/80">
                Patrocinado · {campana.patrocinador}
              </p>
            ) : null}
          </div>
          {campana.imagenHero ? (
            <div className="mx-auto w-full max-w-56 md:max-w-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campana.imagenHeroSet?.s480 ?? campana.imagenHero}
                srcSet={
                  campana.imagenHeroSet
                    ? `${campana.imagenHeroSet.s480} 480w, ${campana.imagenHeroSet.s800} 800w`
                    : undefined
                }
                sizes="(min-width: 768px) 256px, 224px"
                alt={campana.imagenHeroAlt ?? campana.titulo}
                width={380}
                height={475}
                fetchPriority="high"
                decoding="async"
                className="w-full -rotate-2 rounded-[var(--radius-lg)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.5)]"
              />
            </div>
          ) : null}
        </div>
        <div aria-hidden className="h-2.5 w-full" style={{ background: "#ffd200" }} />
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        {/* ── El premio ── */}
        <div className="card flex gap-4 px-6 py-6 md:px-8">
          <span aria-hidden className="w-1 shrink-0 rounded-full bg-brand" />
          <div>
            <p className="label text-faint">El premio</p>
            <p className="headline mt-1.5 text-[clamp(1.3rem,3vw,1.7rem)] text-ink">
              {campana.premio}
            </p>
          </div>
        </div>

        {/* ── Urgencia ── */}
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-y-2 border-ink py-3">
          <p className="label tnum text-ink">
            {estado === "proximamente"
              ? `Abre el ${fmtFecha(campana.inicia)}`
              : estado === "abierta"
                ? `Cierra el ${fmtFecha(campana.termina)}`
                : `Cerró el ${fmtFecha(campana.termina)}`}
          </p>
          {estado === "abierta" && dias !== null ? (
            <p className="label tnum text-brand">
              {dias === 0
                ? "¡Último día!"
                : dias === 1
                  ? "Queda 1 día"
                  : `Quedan ${dias} días`}
            </p>
          ) : null}
        </div>

        {/* ── Formulario o estado ── */}
        <section className="mt-8" aria-label="Participación">
          {estado === "abierta" ? (
            <FormParticipacion campaignSlug={campana.slug} utm={utm} />
          ) : (
            <div className="card px-6 py-10 text-center md:px-10">
              <p className="label text-faint">
                {estado === "proximamente"
                  ? "Todavía no abre"
                  : estado === "pausada"
                    ? "Dinámica en pausa"
                    : "Dinámica cerrada"}
              </p>
              <h3 className="mx-auto mt-3 max-w-md text-2xl">
                {estado === "proximamente"
                  ? `Esta dinámica abre el ${fmtFecha(campana.inicia)}.`
                  : estado === "pausada"
                    ? "Esta dinámica está en pausa por un momento."
                    : "Esta dinámica ya cerró. Pronto anunciamos al ganador."}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Seguí a @sevive.la o suscribite al boletín para no perderte la
                próxima.
              </p>
              <Link
                href="/#boletin"
                className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
              >
                Quiero que me avisen
              </Link>
            </div>
          )}
        </section>

        {/* ── Legales siempre visibles ── */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-muted">
            La participación es <strong>gratuita</strong> y válida{" "}
            <strong>solo para Costa Rica</strong>. Requisitos del premio: ser
            mayor de 21 años y tener pasaporte y visa americana al día. Al
            participar aceptás las{" "}
            <Link href={`/legal/bases/${campana.slug}`} className="underline">
              bases y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/legal/privacidad" className="underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </footer>
      </div>
    </article>
  );
}
