import type { Metadata } from "next";
import { getEventosProximos } from "@/lib/sanity/listados";
import { MiAgendaLista, type Sugerencia } from "@/components/evento/mi-agenda-lista";

export const metadata: Metadata = {
  title: "Mi agenda",
  description:
    "Tus planes guardados en SeViveLa: los eventos que marcaste para no perderte, ordenados por fecha y siempre a mano en tu teléfono.",
  robots: { index: false },
};

export const revalidate = 300;

export default async function MiAgendaPage() {
  // Sugerencias del servidor: lo próximo de la agenda, para que la página
  // nunca sea un callejón sin salida (la lista filtra lo ya guardado).
  const eventos = await getEventosProximos();
  const sugerencias: Sugerencia[] = eventos
    .filter((e) => e.href && e.inicio)
    .map((e) => ({
      slug: e.href!.split("/")[2] ?? "",
      title: e.title,
      inicio: e.inicio,
      lugar: e.lugarNombre,
      vertical: e.vertical,
      hora: e.hora,
    }))
    .filter((s) => s.slug)
    .slice(0, 12);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Guardados</p>
        <h1 className="mt-2 text-[clamp(2.4rem,7vw,4.5rem)]">Mi agenda</h1>
        <p className="measure mt-3 leading-relaxed text-muted">
          Los planes que guardaste, próximos primero.
        </p>
      </header>
      <MiAgendaLista sugerencias={sugerencias} />
    </section>
  );
}
