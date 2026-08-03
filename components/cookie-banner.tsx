"use client";

/**
 * Aviso de cookies (Ley 8968 / buenas prácticas): informativo, porque el
 * sitio solo usa almacenamiento propio y funcional (preferencias, referidos,
 * anti-bots) — nada de rastreo publicitario de terceros. Se muestra una vez;
 * "Entendido" queda guardado en el dispositivo. Si cambia la política,
 * subir la versión de la clave para volver a mostrarlo.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const CLAVE = "sv_cookies_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE)) return;
    } catch {
      /* sin memoria local: mejor no insistir en cada página */
      return;
    }
    setVisible(true);
    // Un frame después para que la transición de entrada corra.
    requestAnimationFrame(() => requestAnimationFrame(() => setEntrando(true)));
  }, []);

  if (!visible) return null;

  function aceptar() {
    try {
      localStorage.setItem(CLAVE, new Date().toISOString());
    } catch {
      /* nada */
    }
    setEntrando(false);
    setTimeout(() => setVisible(false), 240);
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
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
          Usamos cookies y almacenamiento propios para que el sitio funcione y
          recordar tus preferencias. Sin rastreo publicitario de terceros.{" "}
          <Link href="/legal/cookies" className="underline hover:text-paper">
            Política de cookies
          </Link>
        </p>
        <button
          type="button"
          onClick={aceptar}
          className="pressable mt-3 w-full bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover md:w-auto"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
