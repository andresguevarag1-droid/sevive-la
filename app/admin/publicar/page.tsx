import type { Metadata } from "next";
import Link from "next/link";
import { PublicarCaption } from "@/components/admin/publicar-caption";

export const metadata: Metadata = {
  title: "Panel · Publicar desde un post",
  robots: { index: false, follow: false },
};

export default function AdminPublicarPage() {
  return (
    <main className="min-h-dvh px-4 py-8 md:py-12">
      <nav aria-label="Panel" className="mx-auto mb-6 flex max-w-3xl gap-4">
        <Link href="/admin/datos" className="label text-faint hover:text-ink">
          Datos
        </Link>
        <Link href="/admin/locales" className="label text-faint hover:text-ink">
          Locales
        </Link>
        <Link href="/admin/publicar" className="label text-ink underline">
          Publicar
        </Link>
      </nav>
      <PublicarCaption />
    </main>
  );
}
