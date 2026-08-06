import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confirmar baja",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

/** Paso de confirmación humana: el link del correo llega aquí y la baja
 *  solo se ejecuta con el botón (POST) — nunca por un prefetch. */
export default async function ConfirmarBajaPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string; x?: string }>;
}) {
  const { e, t, x } = await searchParams;

  if (!e || !t) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
        <p className="label text-faint">Enlace incompleto</p>
        <h1 className="mx-auto mt-3 max-w-lg text-3xl">
          Este enlace de baja no es válido.
        </h1>
        <Link href="/" className="label mt-6 inline-block text-brand underline">
          Volver a la portada
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <p className="label text-faint">Baja del boletín</p>
      <h1 className="mx-auto mt-3 max-w-lg text-3xl">
        ¿Querés dejar de recibir nuestros correos?
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Un toque más y listo. Podés volver a suscribirte cuando quieras.
      </p>
      <form action="/api/baja" method="post" className="mt-8">
        <input type="hidden" name="e" value={e} />
        <input type="hidden" name="t" value={t} />
        {x ? <input type="hidden" name="x" value={x} /> : null}
        <button
          type="submit"
          className="pressable inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Confirmar mi baja
        </button>
      </form>
      <Link href="/" className="label mt-6 inline-block text-muted underline">
        Mejor no, llevame a la portada
      </Link>
    </section>
  );
}
