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
  const clase =
    "pressable inline-flex min-h-11 items-center justify-center border border-rule px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink";

  return (
    <div className="mt-10 border-y border-rule py-5">
      <p className="label text-faint">Compartí esta nota</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("share_click", { metodo: "whatsapp", path: pathname ?? "" })}
          className={clase}
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
          className={clase}
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
            className={clase}
          >
            Más opciones
          </button>
        ) : null}
      </div>
    </div>
  );
}
