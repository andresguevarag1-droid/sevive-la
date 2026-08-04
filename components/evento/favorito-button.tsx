"use client";

/**
 * Botón "Guardar en mi agenda" (R3): corazón que persiste en el dispositivo.
 * La señal de guardado es el interés más fuerte que deja una persona.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { esFavorito, toggleFavorito } from "@/lib/favoritos";
import { track } from "@/lib/analytics/track";
import type { VerticalSlug } from "@/lib/site";

export function FavoritoButton({
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
  const [recienGuardado, setRecienGuardado] = useState(false);

  useEffect(() => {
    setGuardado(esFavorito(slug));
  }, [slug]);

  function alternar() {
    const quedo = toggleFavorito({ slug, title: titulo, inicio, lugar, vertical });
    setGuardado(quedo);
    setRecienGuardado(quedo);
    track(quedo ? "favorite_add" : "favorite_remove", { event_slug: slug });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={alternar}
        aria-pressed={guardado}
        className="pressable inline-flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-semibold transition-colors"
        style={
          guardado
            ? {
                background: "var(--color-brand)",
                borderColor: "var(--color-brand)",
                color: "#ffffff",
              }
            : { borderColor: "var(--color-rule)", color: "var(--color-ink)" }
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={guardado ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M12 19.5C7.2 15.9 4.2 12.9 4.2 9.7 4.2 7.2 6.1 5.2 8.5 5.2c1.4 0 2.7.7 3.5 2 .8-1.3 2.1-2 3.5-2 2.4 0 4.3 2 4.3 4.5 0 3.2-3 6.2-7.8 9.8z" />
        </svg>
        {guardado ? "Guardado" : "Guardar en mi agenda"}
      </button>
      {recienGuardado ? (
        <Link href="/mi-agenda" className="text-sm text-brand underline">
          Ver mi agenda
        </Link>
      ) : null}
    </div>
  );
}
