import type { Metadata } from "next";
import Link from "next/link";
import { PanelDatos } from "@/components/admin/panel-datos";

export const metadata: Metadata = {
  title: "Panel · Tablero de datos",
  robots: { index: false, follow: false },
};

export default function AdminDatosPage() {
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <nav aria-label="Panel" className="mx-auto mb-6 flex max-w-3xl gap-4">
        <Link href="/admin/datos" className="label text-ink underline">
          Datos
        </Link>
        <Link href="/admin/locales" className="label text-faint hover:text-ink">
          Locales
        </Link>
      </nav>
      <PanelDatos />
    </main>
  );
}
