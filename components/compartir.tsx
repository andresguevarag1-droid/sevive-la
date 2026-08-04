"use client";

/**
 * Compartir una página (crónicas): WhatsApp, copiar link y compartir nativo.
 * Tu audiencia vive en IG/WhatsApp — cada pieza debe poder viajar. Cada
 * método emite share_click (conversión en la analítica).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

export function Compartir({ titulo }: { titulo: string }) {
  const pathname = usePathname();
  const [copiado, setCopiado] = useState(false);
  const [tieneNativo, setTieneNativo] = useState(false);

  useEffect(() => {
    setTieneNativo(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const url = typeof window !== "undefined" ? `${location.origin}${pathname}` : "";
  const mensaje = `${titulo} — lo leí en SeViveLa: ${url}`;
  // Pastillas con los degradados de la paleta del flyer (branding de campaña).
  const pill =
    "pressable inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(26,21,38,0.45)] transition-[filter] duration-200 hover:brightness-110";

  return (
    <div className="mt-10 border-y border-rule py-5">
      <p className="label text-faint">Compartí esta nota</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("share_click", { metodo: "whatsapp", path: pathname ?? "" })}
          className={pill}
          style={{ background: "linear-gradient(135deg, #FA872E 0%, #DC138A 100%)" }}
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={async () => {
            track("share_click", { metodo: "copiar", path: pathname ?? "" });
            try {
              await navigator.clipboard.writeText(url);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              /* clipboard bloqueado */
            }
          }}
          className={pill}
          style={{ background: "linear-gradient(135deg, #DC138A 0%, #2C1063 100%)" }}
        >
          {copiado ? "¡Copiado!" : "Copiar link"}
        </button>
        {tieneNativo ? (
          <button
            type="button"
            onClick={() => {
              track("share_click", { metodo: "nativo", path: pathname ?? "" });
              navigator.share({ title: titulo, url }).catch(() => {});
            }}
            className={pill}
            style={{ background: "linear-gradient(135deg, #22A8B7 0%, #2C1063 100%)" }}
          >
            Más opciones
          </button>
        ) : null}
      </div>
    </div>
  );
}
