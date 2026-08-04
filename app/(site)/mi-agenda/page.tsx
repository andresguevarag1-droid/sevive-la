import type { Metadata } from "next";
import { MiAgendaLista } from "@/components/evento/mi-agenda-lista";

export const metadata: Metadata = {
  title: "Mi agenda",
  description:
    "Tus planes guardados en SeViveLa: los eventos que marcaste para no perderte, ordenados por fecha y siempre a mano en tu teléfono.",
  robots: { index: false },
};

export default function MiAgendaPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Guardados</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Mi agenda</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Los planes que guardaste, próximos primero. Viven en este
          dispositivo.
        </p>
      </header>
      <MiAgendaLista />
    </section>
  );
}
