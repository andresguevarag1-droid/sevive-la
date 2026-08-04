"use client";

/**
 * "Mi agenda" (R3): los eventos guardados en este dispositivo, próximos
 * primero. Sin login: la lista vive en el teléfono de la persona.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavoritos, quitarFavorito, type Favorito } from "@/lib/favoritos";
import { CategoryLabel } from "@/components/kicker";
import { track } from "@/lib/analytics/track";

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  })
    .format(d)
    .replace(/\./g, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MiAgendaLista() {
  const [favoritos, setFavoritos] = useState<Favorito[] | null>(null);

  useEffect(() => {
    setFavoritos(getFavoritos());
  }, []);

  if (favoritos === null) return null;

  if (favoritos.length === 0) {
    return (
      <div className="py-16 text-center md:py-24">
        <p className="label text-faint">Nada guardado todavía</p>
        <h2 className="mx-auto mt-3 max-w-lg text-2xl">
          Guardá los planes que no querés perderte.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          En cada evento vas a ver el botón “Guardar en mi agenda”. Lo que
          guardés queda aquí, en tu teléfono.
        </p>
        <Link
          href="/agenda"
          className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Explorar la agenda
        </Link>
      </div>
    );
  }

  const corte = Date.now() - 12 * 3600000;
  const proximos = favoritos
    .filter((f) => new Date(f.inicio).getTime() >= corte)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pasados = favoritos
    .filter((f) => new Date(f.inicio).getTime() < corte)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const Fila = ({ f, pasado }: { f: Favorito; pasado?: boolean }) => (
    <li className="flex items-baseline gap-4 border-b border-rule py-4">
      <div className={`min-w-0 flex-1 ${pasado ? "opacity-50" : ""}`}>
        <CategoryLabel vertical={f.vertical} className="mb-1.5" />
        <Link href={`/agenda/${f.slug}`} className="group block">
          <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
            {f.title}
          </h3>
        </Link>
        <p className="tnum mt-1 text-sm text-muted">
          <time dateTime={f.inicio}>{fmt(f.inicio)}</time>
          {f.lugar ? ` · ${f.lugar}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          quitarFavorito(f.slug);
          setFavoritos(getFavoritos());
          track("favorite_remove", { event_slug: f.slug });
        }}
        className="label shrink-0 text-faint underline hover:text-ink"
      >
        Quitar
      </button>
    </li>
  );

  return (
    <div className="mt-8">
      {proximos.length > 0 ? (
        <ul className="border-t border-rule">
          {proximos.map((f) => (
            <Fila key={f.slug} f={f} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No tenés planes próximos guardados.{" "}
          <Link href="/agenda" className="text-brand underline">
            Explorá la agenda
          </Link>
          .
        </p>
      )}
      {pasados.length > 0 ? (
        <section className="mt-10">
          <h2 className="label border-b border-ink pb-2 text-faint">Ya pasaron</h2>
          <ul>
            {pasados.map((f) => (
              <Fila key={f.slug} f={f} pasado />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
