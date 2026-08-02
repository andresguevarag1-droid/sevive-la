"use client";

/**
 * Widget de Cloudflare Turnstile con carga diferida: el script solo se
 * inyecta cuando el widget entra al viewport, para proteger el presupuesto
 * de JS inicial. Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurada,
 * no renderiza nada (el servidor tampoco exige el token).
 */
import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
    }
  ) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("No se pudo cargar Turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function TurnstileWidget({
  onToken,
  theme = "light",
}: {
  /** Recibe el token al resolverse el reto; string vacío si expira. */
  onToken: (token: string) => void;
  theme?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [fallo, setFallo] = useState(false);
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const el = ref.current;

    const montar = () => {
      rendered.current = true;
      loadScript()
        .then(() => {
          setFallo(false);
          window.turnstile?.render(el, {
            sitekey: SITE_KEY,
            callback: onToken,
            "expired-callback": () => onToken(""),
            theme,
            size: "flexible",
          });
        })
        .catch((err) => {
          console.error("[turnstile]", err);
          rendered.current = false;
          setFallo(true);
        });
    };

    if (reintento > 0 && !rendered.current) {
      montar();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || rendered.current) return;
        observer.disconnect();
        montar();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // onToken se captura una vez a propósito: el widget se renderiza una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, reintento]);

  if (!SITE_KEY) return null;
  return (
    <div className="mt-4 min-h-[65px]">
      <div ref={ref} />
      {fallo ? (
        <p className={`text-sm ${theme === "dark" ? "text-paper/80" : "text-muted"}`}>
          No se pudo cargar la verificación anti-bots.{" "}
          <button
            type="button"
            onClick={() => setReintento((n) => n + 1)}
            className="font-semibold underline"
          >
            Reintentar
          </button>
        </p>
      ) : null}
    </div>
  );
}
