"use client";

/**
 * Carrusel de portadas: varias notas líder que rotan solas (7 s). Con UNA
 * sola portada se comporta exactamente como la nota líder de siempre —
 * queda listo para cuando el equipo marque más notas como portada.
 *
 * Vida sin mareo: pausa al pasar el cursor, al tocar, al enfocar con
 * teclado y cuando la pestaña no está visible; con prefers-reduced-motion
 * no rota solo (los puntos siguen funcionando). Swipe en móvil.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "@/lib/content";
import { LeadStory } from "@/components/lead-story";
import { track } from "@/lib/analytics/track";

const INTERVALO_MS = 7000;

export function PortadaCarrusel({
  stories,
  as = "h1",
}: {
  stories: Story[];
  /** "h2" cuando hay campaña activa (el hero de campaña lleva el h1). */
  as?: "h1" | "h2";
}) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const sinMovimiento = useRef(false);
  const toqueX = useRef<number | null>(null);
  const total = stories.length;

  const ir = useCallback(
    (i: number, manual = false) => {
      const destino = ((i % total) + total) % total;
      setIndice(destino);
      if (manual) track("nav_click", { item: `portada_${destino + 1}`, nav: "portada" });
    },
    [total]
  );

  useEffect(() => {
    sinMovimiento.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (total < 2 || pausado || sinMovimiento.current) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndice((i) => (i + 1) % total);
      }
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [total, pausado]);

  if (total === 0) return null;
  if (total === 1) return <LeadStory story={stories[0]} as={as} />;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Notas de portada"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onTouchStart={(e) => {
        setPausado(true);
        toqueX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const inicio = toqueX.current;
        toqueX.current = null;
        // La pausa por toque se libera sola tras un rato.
        setTimeout(() => setPausado(false), INTERVALO_MS);
        if (inicio === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? inicio) - inicio;
        if (Math.abs(delta) > 48) ir(indice + (delta < 0 ? 1 : -1), true);
      }}
    >
      <div className="overflow-hidden">
        <div
          className="flex items-start transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {stories.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== indice}
              className={`w-full shrink-0 ${i === indice ? "" : "pointer-events-none select-none"}`}
              // Los slides ocultos no participan del tab-order.
              {...(i !== indice ? { inert: true } : {})}
            >
              {/* Solo la portada visible primero lleva el heading principal */}
              <LeadStory story={s} as={i === 0 ? as : "h2"} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Puntos: uno por portada, con el activo alargado ── */}
      <div className="mt-5 flex items-center justify-center gap-2.5" role="tablist" aria-label="Elegir portada">
        {stories.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === indice}
            aria-label={`Portada ${i + 1}: ${s.title}`}
            onClick={() => ir(i, true)}
            className={`pressable h-2.5 rounded-full transition-all duration-300 ${
              i === indice ? "w-7 bg-brand" : "w-2.5 bg-ink/25 hover:bg-ink/45"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
