"use client";

/**
 * Restaura la agenda respaldada en ESTE dispositivo: fusiona los planes del
 * respaldo con lo que ya haya en localStorage (sin duplicar) y deja el
 * correo listo para futuras actualizaciones del respaldo.
 */
import { useState } from "react";
import Link from "next/link";
import type { VerticalSlug } from "@/lib/site";
import { getFavoritos, restaurarFavorito } from "@/lib/favoritos";
import { track } from "@/lib/analytics/track";

export type ItemRespaldo = {
  slug: string;
  title: string;
  inicio: string;
  lugar?: string;
  vertical: VerticalSlug;
};

export function RestaurarAgenda({
  items,
  email,
}: {
  items: ItemRespaldo[];
  email: string;
}) {
  const [hecho, setHecho] = useState(false);
  const [agregados, setAgregados] = useState(0);

  const restaurar = () => {
    const existentes = new Set(getFavoritos().map((f) => f.slug));
    let nuevos = 0;
    for (const i of items) {
      if (existentes.has(i.slug)) continue;
      restaurarFavorito({
        slug: i.slug,
        title: i.title,
        inicio: i.inicio,
        lugar: i.lugar,
        vertical: i.vertical,
        guardadoEn: new Date().toISOString(),
      });
      nuevos++;
    }
    try {
      localStorage.setItem("sv_agenda_correo", email);
    } catch {
      /* sin memoria local */
    }
    track("form_submit_success", { form: "agenda_recuperar", agregados: nuevos });
    setAgregados(nuevos);
    setHecho(true);
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <p className="label text-faint">Recuperar mi agenda</p>
      {hecho ? (
        <>
          <h1 className="mx-auto mt-3 max-w-lg text-3xl">
            ¡Listo! Tu agenda está en este teléfono.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            {agregados > 0
              ? `Se ${agregados === 1 ? "agregó 1 plan" : `agregaron ${agregados} planes`} a este dispositivo.`
              : "Todos los planes del respaldo ya estaban en este dispositivo."}
          </p>
          <Link
            href="/mi-agenda"
            className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Ver mi agenda
          </Link>
        </>
      ) : (
        <>
          <h1 className="mx-auto mt-3 max-w-lg text-3xl">
            Encontramos {items.length === 1 ? "1 plan guardado" : `${items.length} planes guardados`}.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Respaldados como <span className="font-semibold text-ink">{email}</span>.
            Tocá el botón para tenerlos en este dispositivo (lo que ya tengas
            guardado aquí no se pierde).
          </p>
          <button
            type="button"
            onClick={restaurar}
            className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Restaurar mi agenda aquí
          </button>
        </>
      )}
    </section>
  );
}
