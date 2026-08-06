"use client";

/**
 * Cambiar la decisión de cookies/analítica en cualquier momento (la
 * política lo promete; este botón lo cumple). Borra la elección guardada
 * y recarga: el aviso vuelve a aparecer para decidir de nuevo.
 */
import { useEffect, useState } from "react";
import { getConsentimiento } from "@/lib/analytics/consent";

export function PreferenciasCookies() {
  const [decision, setDecision] = useState<string | null>(null);

  useEffect(() => {
    const c = getConsentimiento();
    setDecision(c === null ? null : c.analitica ? "aceptada" : "rechazada");
  }, []);

  const reabrir = () => {
    try {
      localStorage.removeItem("sv_consent_v2");
    } catch {
      /* sin memoria local */
    }
    location.reload();
  };

  return (
    <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <p className="m-0 text-sm text-muted">
        {decision === null
          ? "Todavía no elegiste tus preferencias de analítica."
          : `Tu decisión actual: analítica ${decision}.`}
      </p>
      <button
        type="button"
        onClick={reabrir}
        className="pressable min-h-11 shrink-0 border-2 border-ink px-5 py-2 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
      >
        Cambiar mi decisión
      </button>
    </div>
  );
}
