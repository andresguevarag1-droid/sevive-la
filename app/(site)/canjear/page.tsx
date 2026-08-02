import type { Metadata } from "next";
import { CanjeStaff } from "@/components/cupon/canje-staff";

export const metadata: Metadata = {
  title: "Canje de cupones (staff)",
  robots: { index: false },
};

/**
 * Pantalla de canje para locales aliados. El QR de cada cupón abre esta
 * página con ?code=, así que el escaneo lo hace la cámara del teléfono.
 */
export default async function CanjearPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <section className="mx-auto max-w-md px-4 py-10 md:py-14">
      <p className="label text-brand">Locales aliados</p>
      <h1 className="mt-2 text-3xl">Canjear cupón</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Escaneá el QR del cliente con la cámara del teléfono (te trae aquí con
        el código listo) o escribí el código a mano.
      </p>
      <div className="mt-6">
        <CanjeStaff codeInicial={code?.toUpperCase()} />
      </div>
    </section>
  );
}
