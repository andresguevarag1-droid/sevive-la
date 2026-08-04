"use client";

/**
 * Hilo de progreso de lectura (2px, magenta) pegado bajo la franja de
 * navegación. Solo transform: corre en GPU, cero layout.
 */
import { useEffect, useRef } from "react";

export function ProgresoLectura() {
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const medir = () => {
      ticking = false;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const avance = total > 0 ? Math.min(1, window.scrollY / total) : 0;
      if (barra.current) barra.current.style.transform = `scaleX(${avance})`;
    };
    const alScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(medir);
      }
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  return (
    <div aria-hidden className="sticky top-[41px] z-30 -mt-px h-0.5 w-full md:top-[45px]">
      <div
        ref={barra}
        className="h-full w-full origin-left"
        style={{ background: "var(--color-brand)", transform: "scaleX(0)" }}
      />
    </div>
  );
}
