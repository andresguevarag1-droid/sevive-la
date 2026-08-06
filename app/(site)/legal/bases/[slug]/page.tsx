import type { Metadata } from "next";
import { getSlugsDeTipo } from "@/lib/sanity/slugs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getDinamica } from "@/lib/sanity/dinamica";
import { getCampana } from "@/lib/sanity/campana";

type Params = { slug: string };

export const revalidate = 60;

// Prerender de los slugs publicados; los nuevos caen a on-demand (ISR).
export async function generateStaticParams() {
  return getSlugsDeTipo("dinamica");
}

/** Bases: sirven tanto para campañas (hero de home) como para dinámicas. */
async function getBasesDoc(slug: string) {
  const c = await getCampana(slug);
  if (c) {
    return {
      title: c.titulo,
      premio: c.premio,
      inicio: c.inicia,
      cierre: c.termina,
      marca: c.patrocinador,
      bases: c.bases,
      slug: c.slug,
    };
  }
  const d = await getDinamica(slug);
  if (!d) return null;
  return {
    title: d.title,
    premio: d.premio,
    inicio: d.inicio,
    cierre: d.cierre,
    marca: d.marca,
    bases: d.bases,
    slug: d.slug,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getBasesDoc(slug);
  if (!doc) return {};
  return {
    title: `Bases legales · ${doc.title}`,
    description: `Bases y condiciones de la dinámica "${doc.title}" de SeViveLa.`,
    robots: { index: false },
    alternates: { canonical: `/legal/bases/${doc.slug}` },
  };
}

/** Fecha larga es-CR para el encabezado de las bases. */
function fmtFecha(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  }).format(date);
}

export default async function BasesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const d = await getBasesDoc(slug);
  if (!d) notFound();

  return (
    <article>
      <header className="border-b border-rule pb-6">
        <p className="label text-faint">Bases legales</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)]">{d.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <strong>Premio:</strong> {d.premio}
          <br />
          <strong>Vigencia:</strong> del {fmtFecha(d.inicio)} al {fmtFecha(d.cierre)} (hora de Costa Rica)
          {d.marca ? (
            <>
              <br />
              <strong>Marca aliada:</strong> {d.marca}
            </>
          ) : null}
        </p>
        <p className="mt-3 text-sm font-medium text-ink">
          La participación es gratuita. Nunca se cobra por participar.
        </p>
      </header>

      {d.bases?.length ? (
        <div className="prose-editorial measure mt-6 leading-relaxed text-ink/90">
          <PortableText value={d.bases} />
        </div>
      ) : (
        /* Estado vacío: la dinámica aún no tiene bases cargadas en el Studio. */
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Las bases detalladas de esta dinámica se publicarán aquí antes de su
          apertura. Ante cualquier consulta, escribinos.
        </p>
      )}

      <footer className="mt-10 border-t border-rule pt-6 text-sm text-muted">
        <p>
          El tratamiento de los datos personales de las personas participantes
          se rige por nuestra{" "}
          <Link href="/legal/privacidad" className="underline">
            Política de Privacidad
          </Link>{" "}
          (Ley 8968 de Costa Rica).
        </p>
        <p className="mt-3">
          <Link href={`/dinamicas/${d.slug}`} className="underline">
            ← Volver a la dinámica
          </Link>
        </p>
      </footer>
    </article>
  );
}
