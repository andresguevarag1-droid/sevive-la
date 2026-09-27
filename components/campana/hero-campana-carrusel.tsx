"use client";

/**
 * Carrusel de campañas: cuando hay 2+ dinámicas activas a la vez (ej. dos
 * premios de marcas distintas corriendo en simultáneo), rotan solas en el
 * mismo espacio del hero en vez de apilarse una debajo de otra.
 *
 * Mismo comportamiento "sin mareo" que PortadaCarrusel: pausa al pasar el
 * cursor, al tocar, al enfocar con teclado y cuando la pestaña no está
 * visible; con prefers-reduced-motion no rota solo (los puntos siguen
 * funcionando). Swipe en móvil. Con UNA sola campaña activa se comporta
 * exactamente como el hero de campaña de siempre (sin puntos ni rotación).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Campana } from "@/lib/sanity/campana";
import { HeroCampana } from "@/components/campana/hero-campana";
import { track } from "@/lib/analytics/track";

const INTERVALO_MS = 8000;

export function HeroCampanaCarrusel({ campanas }: { campanas: Campana[] }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const sinMovimiento = useRef(false);
  const toqueX = useRef<number | null>(null);
  const total = campanas.length;
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [alto, setAlto] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = slideRefs.current[indice];
    if (!el) return;
    const medir = () => setAlto(el.offsetHeight);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [indice]);

  const ir = useCallback(
    (i: number, manual = false) => {
      const destino = ((i % total) + total) % total;
      setIndice(destino);
      if (manual) track("nav_click", { item: `campana_${destino + 1}`, nav: "hero_campana" });
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
  if (total === 1) return <HeroCampana campana={campanas[0]} as="h1" />;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Dinámicas activas"
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
        setTimeout(() => setPausado(false), INTERVALO_MS);
        if (inicio === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? inicio) - inicio;
        if (Math.abs(delta) > 48) ir(indice + (delta < 0 ? 1 : -1), true);
      }}
      className="relative"
    >
      <div
        className="overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
        style={{ height: alto ? `${alto}px` : undefined }}
      >
        <div
          className="flex items-start transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {campanas.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              aria-hidden={i !== indice}
              className={`w-full shrink-0 ${i === indice ? "" : "pointer-events-none select-none"}`}
              {...(i !== indice ? { inert: true } : {})}
            >
              <HeroCampana campana={c} as={i === indice ? "h1" : "h2"} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Puntos: uno por campaña, con el activo alargado ── */}
      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2" role="group" aria-label="Elegir dinámica">
        {campanas.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={i === indice}
            aria-label={`Dinámica ${i + 1}: ${c.titulo}`}
            onClick={() => ir(i, true)}
            className="pressable flex h-6 min-w-6 items-center justify-center"
          >
            <span
              aria-hidden
              className={`block h-2.5 rounded-full transition-all duration-300 ${
                i === indice ? "w-7 bg-white" : "w-2.5 bg-white/40 hover:bg-white/65"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
