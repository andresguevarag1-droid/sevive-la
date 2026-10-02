import type { Metadata } from "next";
import Link from "next/link";
import { PanelParticipantes } from "@/components/admin/panel-participantes";

export const metadata: Metadata = {
  title: "Panel · Participantes",
  robots: { index: false, follow: false },
};

export default function AdminParticipantesPage() {
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <nav aria-label="Panel" className="mx-auto mb-6 flex max-w-3xl gap-4">
        <Link href="/admin/datos" className="label text-faint hover:text-ink">
          Datos
        </Link>
        <Link href="/admin/participantes" className="label text-ink underline">
          Participantes
        </Link>
        <Link href="/admin/locales" className="label text-faint hover:text-ink">
          Locales
        </Link>
        <Link href="/admin/publicar" className="label text-faint hover:text-ink">
          Publicar
        </Link>
      </nav>
      <PanelParticipantes />
    </main>
  );
}
