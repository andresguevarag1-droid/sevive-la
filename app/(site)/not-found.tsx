import Link from "next/link";

/** 404 editorial dentro del chrome del sitio. */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
      <p className="label tnum text-brand">404</p>
      <h1 className="mx-auto mt-3 max-w-lg text-3xl">
        Esta página no existe (o ya no).
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Puede que el enlace esté vencido o mal escrito. La portada siempre tiene
        algo bueno que hacer.
      </p>
      <Link
        href="/"
        className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
      >
        Ir a la portada
      </Link>
    </section>
  );
}
