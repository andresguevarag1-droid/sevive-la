import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getDinamica, estadoDinamica } from "@/lib/sanity/dinamica";
import { getCampana } from "@/lib/sanity/campana";
import { getVertical } from "@/lib/site";
import { DinamicaForm } from "@/components/dinamica-form";
import { Compartir } from "@/components/compartir";
import { CampanaLanding } from "@/components/campana/landing-campana";
import { CuentaRegresiva } from "@/components/campana/cuenta-regresiva";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

type Params = { slug: string };
type Search = {
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_campaign?: string;
  ref?: string;
};

export const revalidate = 60;

// SIN generateStaticParams a propósito: la landing de campaña lee
// searchParams (UTM + código de referido), que es una API dinámica.
// Con prerender, Next clasificaba la ruta como estática y el slug de la
// campaña reventaba con 500 en producción al tocar searchParams.

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Las campañas (hero de home) tienen su propia landing y metadata.
  const c = await getCampana(slug);
  if (c) {
    const title = c.subtitulo.replace(/\.$/, "");
    const description = `${c.premio} Participar no cuesta nada. Válido solo para Costa Rica.`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        ...(c.ogImage ? { images: [{ url: c.ogImage }] } : {}),
      },
      alternates: { canonical: `/dinamicas/${c.slug}` },
    };
  }

  const d = await getDinamica(slug);
  if (!d) return {};
  const description = `Participá gratis: ${d.premio}`;
  return {
    title: d.title,
    description,
    openGraph: {
      title: d.title,
      description,
      ...(d.imagen ? { images: [{ url: d.imagen }] } : {}),
    },
    alternates: { canonical: `/dinamicas/${d.slug}` },
  };
}

/** Fecha legible en es-CR: "8 de agosto, 18:00". */
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

const pasos = [
  { n: "1", texto: "Dejá tus datos" },
  { n: "2", texto: "Cruzá los dedos" },
  { n: "3", texto: "Te avisamos por correo" },
];

export default async function DinamicaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;

  // Campaña primero: el equipo lanza campañas nuevas desde el Studio sin deploy.
  const campana = await getCampana(slug);
  if (campana) {
    const sp = await searchParams;
    return (
      <CampanaLanding
        campana={campana}
        utm={{
          source: sp.utm_source,
          medium: sp.utm_medium,
          content: sp.utm_content,
          campaign: sp.utm_campaign,
        }}
        refInicial={sp.ref}
      />
    );
  }

  const d = await getDinamica(slug);
  if (!d) notFound();

  const v = getVertical(d.vertical);
  const estado = estadoDinamica(d);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      {/* Datos estructurados: la dinámica como evento gratuito (SEO/GEO) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: d.title,
          description: `Participá gratis: ${d.premio}`,
          startDate: d.inicio,
          endDate: d.cierre,
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "VirtualLocation", url: `${site.url}/dinamicas/${d.slug}` },
          image: d.imagen,
          isAccessibleForFree: true,
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "CRC",
            availability:
              estado === "abierta"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
            url: `${site.url}/dinamicas/${d.slug}`,
          },
          organizer: { "@type": "Organization", name: site.name, url: site.url },
        }}
      />
      {/* ── Cabecera ── */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel vertical={d.vertical} />
          <span className="label text-brand">Gratis</span>
        </div>
        <h1 className="mt-3 text-[clamp(2.2rem,6.5vw,3.8rem)] leading-[1.0]">
          {d.title}
        </h1>
        {d.patrocinado && d.marca ? (
          <p className="label mt-3 text-faint">
            Contenido patrocinado · en alianza con {d.marca}
          </p>
        ) : d.marca ? (
          <p className="label mt-3 text-faint">En alianza con {d.marca}</p>
        ) : null}
      </header>

      {d.imagen ? (
        <div className="mt-6">
          <EditorialImage src={d.imagen} alt={d.imagenAlt ?? d.title} ratio="16 / 9" priority />
        </div>
      ) : null}

      {/* ── El premio, protagonista ── */}
      <div className="card mt-6 flex gap-4 px-6 py-6 md:px-8">
        <span aria-hidden className="w-1 shrink-0 rounded-full bg-brand" />
        <div>
          <p className="label text-faint">El premio</p>
          <p className="headline mt-1.5 text-[clamp(1.3rem,3vw,1.7rem)] text-ink">
            {d.premio}
          </p>
        </div>
      </div>

      {/* ── Urgencia: cuenta regresiva con los stickers del logo ── */}
      {estado === "abierta" ? (
        <CuentaRegresiva
          cierre={d.cierre}
          etiqueta={`Cierra el ${fmtFecha(d.cierre)}`}
        />
      ) : (
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-y-2 border-ink py-3">
          <p className="label tnum text-ink">
            {estado === "proximamente"
              ? `Abre el ${fmtFecha(d.inicio)}`
              : `Cerró el ${fmtFecha(d.cierre)}`}
          </p>
        </div>
      )}

      {/* ── Descripción editorial ── */}
      {d.descripcion?.length ? (
        <div className="prose-editorial measure mt-6 leading-relaxed text-ink/90">
          <PortableText value={d.descripcion} />
        </div>
      ) : null}

      {/* ── Cómo participar (solo si está abierta) ── */}
      {estado === "abierta" ? (
        <ol className="mt-8 grid grid-cols-3 gap-3">
          {pasos.map((p) => (
            <li key={p.n} className="text-center">
              <span className="tnum mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-sm font-bold text-ink">
                {p.n}
              </span>
              <p className="mt-2 text-[13px] font-medium leading-snug text-muted">
                {p.texto}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      {/* ── Formulario según estado ── */}
      <section className="mt-10" aria-label="Participación">
        {estado === "abierta" ? (
          <DinamicaForm slug={d.slug} pregunta={d.pregunta} />
        ) : estado === "proximamente" ? (
          <div className="card px-6 py-10 text-center md:px-10">
            <p className="label text-faint">Todavía no abre</p>
            <h3 className="mx-auto mt-3 max-w-md text-2xl">
              Esta dinámica abre el {fmtFecha(d.inicio)}.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Suscribite al boletín y te avisamos cuando esté abierta.
            </p>
            <Link
              href="/#boletin"
              className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Quiero que me avisen
            </Link>
          </div>
        ) : (
          <div className="card px-6 py-10 text-center md:px-10">
            <p className="label text-faint">Dinámica cerrada</p>
            <h3 className="mx-auto mt-3 max-w-md text-2xl">
              Esta dinámica ya cerró.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Pronto anunciamos a la persona ganadora. Suscribite al boletín
              para no perderte la próxima.
            </p>
            <Link
              href="/"
              className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Ver más planes
            </Link>
          </div>
        )}
      </section>

      {/* ── Compartir: cada participante puede traer al siguiente ── */}
      <Compartir
        titulo={d.title}
        etiqueta="Compartí esta dinámica"
        frase="participá gratis vía SeViveLa"
        historiaUrl={`/api/historia/dinamica/${d.slug}`}
      />

      {/* ── Legales siempre visibles ── */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-muted">
          La participación es <strong>gratuita</strong>. Al participar aceptás
          las{" "}
          <Link href={`/legal/bases/${d.slug}`} className="underline">
            bases de la dinámica
          </Link>{" "}
          y la{" "}
          <Link href="/legal/privacidad" className="underline">
            Política de Privacidad
          </Link>
          .
        </p>
        {v ? (
          <p className="mt-2 text-sm text-muted">
            Más de{" "}
            <Link href={`/${v.slug}`} className="underline">
              {v.name}
            </Link>
            .
          </p>
        ) : null}
      </footer>
    </article>
  );
}
