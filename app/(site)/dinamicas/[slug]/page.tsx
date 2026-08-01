import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { getDinamica, estadoDinamica } from "@/lib/sanity/dinamica";
import { getVertical } from "@/lib/site";
import { DinamicaForm } from "@/components/dinamica-form";
import { EditorialImage } from "@/components/editorial-image";
import { CategoryLabel } from "@/components/kicker";

type Params = { slug: string };

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDinamica(slug);
  if (!d) return {};
  const description = `Participá gratis: ${d.premio}`;
  return {
    title: d.title,
    description,
    openGraph: {
      title: d.title,
      description,
      images: d.imagen ? [{ url: d.imagen }] : undefined,
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

export default async function DinamicaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const d = await getDinamica(slug);
  if (!d) notFound();

  const v = getVertical(d.vertical);
  const estado = estadoDinamica(d);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      {/* ── Cabecera ── */}
      <header>
        <CategoryLabel vertical={d.vertical} />
        <h1 className="mt-3 text-[clamp(2rem,6vw,3.4rem)]">{d.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          <span className="font-semibold text-ink">Premio:</span> {d.premio}
        </p>
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

      {/* ── Ventana de participación ── */}
      <p className="label tnum mt-6 border-y border-rule py-3 text-muted">
        {estado === "proximamente"
          ? `Abre el ${fmtFecha(d.inicio)} · cierra el ${fmtFecha(d.cierre)}`
          : `Participá hasta el ${fmtFecha(d.cierre)}`}
      </p>

      {/* ── Descripción editorial ── */}
      {d.descripcion?.length ? (
        <div className="prose-editorial measure mt-6 leading-relaxed text-ink/90">
          <PortableText value={d.descripcion} />
        </div>
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
