"use client";

/**
 * "Volver arriba" flotante (móvil primero): aparece tras scroll profundo.
 * Respeta prefers-reduced-motion (scroll instantáneo) y emite
 * back_to_top_click para medir en qué páginas hace falta.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

export function VolverArriba() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const medir = () => {
      ticking = false;
      setVisible(window.scrollY > 1200);
    };
    const alScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(medir);
      }
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Volver arriba"
      onClick={() => {
        track("back_to_top_click", { path: pathname ?? "" });
        const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reducido ? "auto" : "smooth" });
      }}
      className="pressable fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full text-paper shadow-[0_10px_28px_-8px_rgba(26,21,38,0.5)] md:bottom-6 md:right-6"
      style={{ background: "var(--color-ink)" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
