import type { Metadata } from "next";
import Link from "next/link";
import { PanelLocales } from "@/components/admin/panel-locales";

/**
 * Herramienta interna del dueño (fuera del chrome público y del index).
 * La seguridad real está en las APIs (ADMIN_PANEL_KEY): esta página solo
 * pinta la interfaz.
 */
export const metadata: Metadata = {
  title: "Panel · Locales de canje",
  robots: { index: false, follow: false },
};

export default function AdminLocalesPage() {
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <nav aria-label="Panel" className="mx-auto mb-6 flex max-w-2xl gap-4">
        <Link href="/admin/datos" className="label text-faint hover:text-ink">
          Datos
        </Link>
        <Link href="/admin/locales" className="label text-ink underline">
          Locales
        </Link>
      </nav>
      <PanelLocales />
    </main>
  );
}
