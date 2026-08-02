import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Baja del boletín",
  robots: { index: false },
};

export default async function BajaPage({
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
        {falló ? "No pudimos procesar la baja." : "Listo, ya no te escribimos."}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        {falló
          ? "El enlace puede estar incompleto. Escribinos a hola@sevive.la y lo resolvemos al momento."
          : "Dimos de baja tu correo del boletín. Si algún día querés volver, la puerta queda abierta."}
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
