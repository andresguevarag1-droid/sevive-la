import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBeneficio, beneficioVigente } from "@/lib/sanity/beneficio";
import { CategoryLabel } from "@/components/kicker";
import { FormCupon } from "@/components/cupon/form-cupon";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

type Params = { slug: string };

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBeneficio(slug);
  if (!b) return {};
  const description = `${b.detalle} en ${b.marca}. ${
    b.cuponMedible
      ? "Reclamá tu cupón gratuito con código y QR, y canjealo en el local — un solo uso por persona."
      : "Un beneficio exclusivo para la comunidad de SeViveLa."
  }${b.vigencia ? ` Válido hasta el ${b.vigencia}.` : ""}`;
  return {
    title: `${b.title} · ${b.marca}`,
    description,
    openGraph: { title: `${b.title} · ${b.marca}`, description },
    alternates: { canonical: `/promociones/${b.slug}` },
  };
}

export default async function BeneficioPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const b = await getBeneficio(slug);
  if (!b) notFound();

  const vigente = beneficioVigente(b);

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      {/* Datos estructurados: la promoción como Offer + migas de pan */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Offer",
          name: b.title,
          description: b.detalle,
          url: `${site.url}/promociones/${b.slug}`,
          inLanguage: site.locale,
          seller: { "@type": "Organization", name: b.marca },
          offeredBy: { "@type": "Organization", name: site.name, url: site.url },
          availability: vigente
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
          ...(b.vigencia ? { validThrough: `${b.vigencia}T23:59:59-06:00` } : {}),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: site.url },
            {
              "@type": "ListItem",
              position: 2,
              name: "Beneficios",
              item: `${site.url}/promociones`,
            },
            { "@type": "ListItem", position: 3, name: b.title },
          ],
        }}
      />
      <nav aria-label="Ruta" className="label text-faint">
        <Link href="/promociones" className="ulink hover:text-ink">
          Beneficios
        </Link>{" "}
        <span aria-hidden>›</span> {b.marca}
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel vertical={b.vertical} />
          {b.patrocinado ? <span className="label text-faint">Patrocinado</span> : null}
        </div>
        <p className="label mt-3 text-faint">{b.marca}</p>
        <h1 className="mt-1 text-[clamp(2rem,6vw,3.2rem)] leading-[1.02]">{b.title}</h1>
        <p className="tnum mt-3 text-xl font-bold text-brand">{b.detalle}</p>
        {b.vigencia ? (
          <p className="label tnum mt-3 border-y border-rule py-3 text-muted">
            Válido hasta el <time dateTime={b.vigencia}>{b.vigencia}</time>
          </p>
        ) : null}
      </header>

      <section className="mt-8" aria-label="Reclamar cupón">
        {!vigente ? (
          <div className="card px-6 py-10 text-center md:px-10">
            <p className="label text-faint">Beneficio vencido</p>
            <h2 className="mx-auto mt-3 max-w-md text-2xl">
              Este beneficio ya no está disponible.
            </h2>
            <Link
              href="/promociones"
              className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Ver más beneficios
            </Link>
          </div>
        ) : b.cuponMedible ? (
          <FormCupon benefitSlug={b.slug} />
        ) : (
          <div className="card px-6 py-8 md:px-10">
            <p className="label text-brand">Cómo usarlo</p>
            <p className="mt-3 leading-relaxed text-ink/90">
              {b.instruccionesCanje ??
                "Mencioná este beneficio de SeViveLa en el local para aplicarlo."}
            </p>
          </div>
        )}
      </section>

      {b.cuponMedible && b.instruccionesCanje ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Condiciones:</strong> {b.instruccionesCanje}
        </p>
      ) : null}
    </article>
  );
}
