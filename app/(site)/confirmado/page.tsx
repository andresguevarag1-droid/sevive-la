import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suscripción confirmada",
  robots: { index: false },
};

export default async function ConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const falló = Boolean(error);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
      <p className="label text-brand">{falló ? "Algo salió mal" : "Boletín"}</p>
      <h1 className="mx-auto mt-3 max-w-lg text-3xl">
        {falló
          ? "No pudimos confirmar tu suscripción."
          : "¡Confirmado! Ya estás en la lista."}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        {falló
          ? "El enlace puede haber expirado o estar incompleto. Volvé a suscribirte y usá el enlace del correo más reciente."
          : "El próximo jueves te llega tu primer boletín con los mejores planes del fin de semana."}
      </p>
      <Link
        href={falló ? "/#boletin" : "/"}
        className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
      >
        {falló ? "Volver a suscribirme" : "Ir a la portada"}
      </Link>
    </section>
  );
}
