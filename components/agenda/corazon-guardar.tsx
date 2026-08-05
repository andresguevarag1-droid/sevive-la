"use client";

/**
 * Corazón de guardado inline (agenda): arma "Mi agenda" sin salir de la
 * lista. Accesible (aria-pressed + etiqueta con el nombre del evento),
 * sincronizado entre vistas vía FAVORITOS_EVENT y medido en la analítica.
 */
import { useEffect, useState } from "react";
import type { VerticalSlug } from "@/lib/site";
import { esFavorito, toggleFavorito, FAVORITOS_EVENT } from "@/lib/favoritos";
import { track } from "@/lib/analytics/track";

export function CorazonGuardar({
  slug,
  titulo,
  inicio,
  lugar,
  vertical,
}: {
  slug: string;
  titulo: string;
  inicio: string;
  lugar?: string;
  vertical: VerticalSlug;
}) {
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const leer = () => setGuardado(esFavorito(slug));
    leer();
    window.addEventListener(FAVORITOS_EVENT, leer);
    return () => window.removeEventListener(FAVORITOS_EVENT, leer);
  }, [slug]);

  const alternar = () => {
    const quedo = toggleFavorito({ slug, title: titulo, inicio, lugar, vertical });
    track(quedo ? "favorite_add" : "favorite_remove", { event_slug: slug });
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={guardado}
      aria-label={
        guardado ? `Quitar ${titulo} de mi agenda` : `Guardar ${titulo} en mi agenda`
      }
      className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors"
      style={
        guardado
          ? {
              borderColor: "var(--color-brand)",
              color: "var(--color-brand)",
              background: "color-mix(in srgb, var(--color-brand) 10%, transparent)",
            }
          : { borderColor: "var(--color-rule)", color: "var(--color-faint)" }
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={guardado ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
