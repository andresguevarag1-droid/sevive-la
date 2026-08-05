import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBeneficio, beneficioVigente } from "@/lib/sanity/beneficio";
import { getBeneficiosTodos } from "@/lib/sanity/listados";
import { getEmitidosPorBeneficio } from "@/lib/server/beneficio-stats";
import { Beneficios } from "@/components/beneficios";
import { CategoryLabel } from "@/components/kicker";
import { FormCupon } from "@/components/cupon/form-cupon";
import { Compartir } from "@/components/compartir";
import { JsonLd } from "@/components/json-ld";
import { TrackClicks } from "@/components/track-clicks";
import { ArrowRightIcon } from "@/components/icons";
import { verticalColor } from "@/lib/content";
import { site } from "@/lib/site";

type Params = { slug: string };

export const revalidate = 60;

/** "martes 5 de agosto" en hora CR (la fecha cruda no se le muestra a nadie). */
function fmtVigencia(iso: string): string {
  const d = new Date(`${iso}T12:00:00-06:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Costa_Rica",
  }).format(d);
}

/** Días que faltan para que venza (fin del día de vigencia, hora CR). */
function diasParaVencer(vigencia?: string): number | null {
  if (!vigencia) return null;
  const fin = new Date(`${vigencia}T23:59:59-06:00`).getTime();
  if (Number.isNaN(fin)) return null;
  return Math.max(0, Math.ceil((fin - Date.now()) / 86400000) - 1);
}

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
  }${b.vigencia ? ` Válido hasta el ${fmtVigencia(b.vigencia)}.` : ""}`;
  return {
    title: `${b.title} · ${b.marca}`,
    description,
    openGraph: {
      title: `${b.title} · ${b.marca}`,
      description,
      images: b.img ? [{ url: b.img }] : undefined,
    },
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
  const [otrosTodos, emitidosPorSlug] = await Promise.all([
    getBeneficiosTodos(),
    getEmitidosPorBeneficio(),
  ]);
  const otros = otrosTodos
    .filter((o) => o.id !== b.id && o.href)
    .slice(0, 3)
    .map((o) => ({ ...o, sponsored: o.patrocinado }));

  const color = verticalColor(b.vertical);
  const emitidos = emitidosPorSlug.get(b.slug);
  const restante =
    b.cupoMaximo && typeof emitidos === "number"
      ? Math.max(0, b.cupoMaximo - emitidos)
      : null;
  const agotado = restante !== null && restante === 0;
  const dias = diasParaVencer(b.vigencia);

  // El sticker de urgencia más importante (cupos > vencimiento).
  const sticker =
    restante !== null && restante > 0 && b.cupoMaximo
      ? {
          texto:
            restante <= Math.max(5, Math.ceil(b.cupoMaximo * 0.2))
              ? `¡Quedan ${restante}!`
              : `Quedan ${restante}`,
          brand: restante <= Math.max(5, Math.ceil(b.cupoMaximo * 0.2)),
        }
      : agotado
        ? { texto: "Agotado", brand: false }
        : dias !== null && dias <= 3
          ? {
              texto:
                dias === 0
                  ? "¡Vence hoy!"
                  : dias === 1
                    ? "¡Vence mañana!"
                    : `¡Vence en ${dias} días!`,
              brand: true,
            }
          : null;

  const ofertaCorta = b.detalle.length <= 14;

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
          image: b.img,
          seller: { "@type": "Organization", name: b.marca },
          offeredBy: { "@type": "Organization", name: site.name, url: site.url },
          availability:
            vigente && !agotado
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
              name: "Cuponera",
              item: `${site.url}/promociones`,
            },
            { "@type": "ListItem", position: 3, name: b.title },
          ],
        }}
      />
      <nav aria-label="Ruta" className="label text-faint">
        <Link href="/promociones" className="ulink hover:text-ink">
          Cuponera
        </Link>{" "}
        <span aria-hidden>›</span> {b.marca}
      </nav>

      {/* ── El arte del cupón, como ticket-sticker ── */}
      {b.img ? (
        <figure data-reveal className="relative mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.img}
            alt={b.title}
            fetchPriority="high"
            decoding="async"
            className={`w-full -rotate-1 rounded-[14px] border-[3px] border-white object-cover shadow-[0_20px_44px_-16px_rgba(26,21,38,0.45)] ${
              agotado ? "opacity-50 grayscale" : ""
            }`}
            style={{ aspectRatio: "16 / 9" }}
          />
          {sticker ? (
            <span
              className={`absolute -top-2 right-4 rotate-2 rounded-[6px] border-[3px] border-white px-3 py-1 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_-6px_rgba(0,0,0,0.5)] ${
                sticker.brand ? "bg-brand" : "bg-ink"
              }`}
            >
              {sticker.texto}
            </span>
          ) : null}
        </figure>
      ) : null}

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel vertical={b.vertical} />
          {b.patrocinado ? <span className="label text-faint">Patrocinado</span> : null}
          {!b.img && sticker ? (
            <span
              className={`rotate-1 rounded-[5px] border-2 border-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.4)] ${
                sticker.brand ? "bg-brand" : "bg-ink"
              }`}
            >
              {sticker.texto}
            </span>
          ) : null}
        </div>
        <p className="label mt-3 text-faint">{b.marca}</p>
        <h1 className="mt-1 text-[clamp(2rem,6vw,3.2rem)] leading-[1.02]">{b.title}</h1>

        {/* La oferta: bloque del logo si es cifra corta; resaltador editorial
            (marker multilínea en el color de la vertical) si es frase */}
        {ofertaCorta ? (
          <p className="mt-4">
            <span
              className="tnum inline-block -rotate-1 rounded-[7px] border-[3px] border-white px-4 py-1.5 text-2xl font-black uppercase tracking-tight text-white shadow-[0_12px_26px_-10px_rgba(0,0,0,0.5)]"
              style={{ background: agotado ? "#8a8494" : color }}
            >
              {b.detalle}
              <span className="text-brand">!</span>
            </span>
          </p>
        ) : (
          <p className="mt-4 text-lg font-bold leading-[1.65] md:text-xl">
            <span
              className="rounded-[4px] px-2 py-1 text-white"
              style={{
                background: agotado ? "#8a8494" : color,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              {b.detalle}
            </span>
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-rule py-3">
          {b.vigencia ? (
            <p className="label tnum text-muted">
              Válido hasta el{" "}
              <time dateTime={b.vigencia} className="font-bold text-ink">
                {fmtVigencia(b.vigencia)}
              </time>
            </p>
          ) : null}
          {typeof emitidos === "number" && emitidos >= 3 ? (
            <p className="tnum label text-muted">
              · {emitidos} personas ya lo reclamaron
            </p>
          ) : null}
        </div>
      </header>

      {/* ── Acción principal primero: canje directo en el sitio de la marca ── */}
      {b.enlace && vigente && !agotado ? (
        <a
          href={b.enlace}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="pressable mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Canjear en el sitio de {b.marca}
          <ArrowRightIcon width={18} height={18} />
        </a>
      ) : null}

      <section className="mt-8" aria-label="Reclamar cupón">
        {!vigente || agotado ? (
          <div className="card px-6 py-10 text-center md:px-10">
            <p className="label text-faint">
              {agotado ? "Cupo agotado" : "Beneficio vencido"}
            </p>
            <h2 className="mx-auto mt-3 max-w-md text-2xl">
              {agotado
                ? "Se recortaron todos los cupones de este beneficio."
                : "Este beneficio ya no está disponible."}
            </h2>
            <Link
              href="/promociones"
              className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Ver la cuponera
            </Link>
          </div>
        ) : b.cuponMedible ? (
          <FormCupon benefitSlug={b.slug} />
        ) : (
          /* ── "Cómo usarlo" como ticket recortable de la cuponera ── */
          <div className="relative pt-2">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[18px] border-2 border-dashed border-ink/25"
            />
            <div className="m-2.5 -rotate-[0.5deg] overflow-hidden rounded-[12px] border-[3px] border-white bg-white px-5 py-6 shadow-[0_16px_36px_-14px_rgba(26,21,38,0.35)] md:px-7">
              <span className="inline-block -rotate-1 rounded-[5px] border-2 border-white bg-ink px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.4)]">
                Cómo usarlo
              </span>
              <p className="mt-4 leading-relaxed text-ink/90">
                {b.instruccionesCanje ??
                  "Mencioná este beneficio de SeViveLa en el local para aplicarlo."}
              </p>
              <div className="mt-5 flex items-end justify-between gap-3 border-t border-dashed border-rule pt-4">
                <p className="label text-faint">{b.marca}</p>
                <span aria-hidden className="flex flex-col items-end gap-0.5 opacity-60">
                  <span
                    className="h-5 w-16"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, var(--color-ink) 0 1.5px, transparent 1.5px 3px, var(--color-ink) 3px 5.5px, transparent 5.5px 7px)",
                    }}
                  />
                  <span className="tnum text-[8px] tracking-[0.3em] text-faint">
                    SEVIVELA
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {b.cuponMedible && b.instruccionesCanje ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Condiciones:</strong> {b.instruccionesCanje}
        </p>
      ) : null}

      {/* ── Compartir: un cupón bueno viaja solo ── */}
      <Compartir
        titulo={`${b.title} · ${b.marca}`}
        etiqueta="Compartí este cupón"
        frase="cupón vía SeViveLa"
      />

      {/* ── Otros beneficios (R5): la sesión no muere aquí ── */}
      {otros.length > 0 ? (
        <TrackClicks module="promo_otros_beneficios">
        <section className="mt-12">
          <div className="flex items-baseline gap-3 border-b border-ink pb-2">
            <h2 className="label text-ink">Más de la cuponera</h2>
            <Link
              href="/promociones"
              className="ulink ml-auto text-[12px] font-medium text-muted"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-6">
            <Beneficios items={otros} gridClassName="sm:grid-cols-2" />
          </div>
        </section>
        </TrackClicks>
      ) : null}
    </article>
  );
}
