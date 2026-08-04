"use client";

/**
 * Banner de consentimiento (D4, Ley 8968):
 * - Nada premarcado; dos opciones con el mismo peso visual.
 * - "Aceptar" habilita la analítica de producto (PostHog) vía evento.
 * - "Solo esenciales" deja únicamente lo funcional y la medición sin cookies.
 * - Registra versión + fecha de la decisión; subir CONSENT_VERSION re-pregunta.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsentimiento, setConsentimiento } from "@/lib/analytics/consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    try {
      if (getConsentimiento()) return; // ya decidió (esta versión)
    } catch {
      return;
    }
    setVisible(true);
    // Un frame después para que la transición de entrada corra.
    requestAnimationFrame(() => requestAnimationFrame(() => setEntrando(true)));
  }, []);

  if (!visible) return null;

  function decidir(analitica: boolean) {
    setConsentimiento(analitica);
    setEntrando(false);
    setTimeout(() => setVisible(false), 240);
  }

  return (
    <div
      role="region"
      aria-label="Consentimiento de cookies"
      className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto max-w-md transition-[transform,opacity] duration-300 ease-[var(--ease-out)] md:inset-x-auto md:bottom-5 md:right-5"
      style={{
        transform: entrando ? "none" : "translateY(12px)",
        opacity: entrando ? 1 : 0,
      }}
    >
      <div
        className="rounded-[var(--radius-lg)] px-5 py-4 text-paper shadow-[0_18px_50px_-12px_rgba(26,21,38,0.55)]"
        style={{ background: "var(--color-ink)" }}
      >
        <p className="text-[13px] leading-relaxed text-paper/85">
          Usamos cookies propias esenciales y, solo si aceptás, medición anónima
          de uso para mejorar el sitio. Sin rastreo publicitario de terceros.{" "}
          <Link href="/legal/cookies" className="underline hover:text-paper">
            Política de cookies
          </Link>
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => decidir(true)}
            className="pressable min-h-11 flex-1 bg-brand px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => decidir(false)}
            className="pressable min-h-11 flex-1 border border-paper/40 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:border-paper"
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  );
}
