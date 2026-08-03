"use client";

/**
 * Arma los reveals al scroll de los elementos [data-reveal].
 * Reglas de oro:
 * - Lo que ya está a la vista al cargar NUNCA se oculta (LCP intacto, cero flash).
 * - Con prefers-reduced-motion no se arma nada: todo queda visible y quieto.
 * - Sin JS este componente no corre → nada se esconde (degradación total).
 * El stagger se asigna por lote de intersección (45ms entre elementos, tope 6).
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const nuevos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-listo])")
    );
    if (!nuevos.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        let lote = 0;
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const el = en.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${Math.min(lote++, 6) * 45}ms`);
          el.classList.add("in-view");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 }
    );

    for (const el of nuevos) {
      el.setAttribute("data-reveal-listo", "");
      const r = el.getBoundingClientRect();
      const visible = r.top < window.innerHeight * 0.96 && r.bottom > 0;
      if (visible) continue; // ya se ve: no ocultar ni animar
      el.classList.add("reveal-armed");
      io.observe(el);
    }

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
