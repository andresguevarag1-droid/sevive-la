"use client";

/**
 * Compartir una página (crónicas): WhatsApp, copiar link y compartir nativo.
 * Tu audiencia vive en IG/WhatsApp — cada pieza debe poder viajar. Cada
 * método emite share_click (conversión en la analítica).
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

export function Compartir({
  titulo,
  etiqueta = "Compartí esta nota",
  frase = "lo leí en SeViveLa",
}: {
  titulo: string;
  /** Rótulo del bloque ("Compartí este cupón"…). */
  etiqueta?: string;
  /** Cierre del mensaje antes del link ("cupón vía SeViveLa"…). */
  frase?: string;
}) {
  const pathname = usePathname();
  const [copiado, setCopiado] = useState(false);
  const [tieneNativo, setTieneNativo] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setTieneNativo(typeof navigator !== "undefined" && "share" in navigator);
    // En estado (no en render): el HTML del servidor salía con href vacío
    // y React no lo parchaba al hidratar.
    setUrl(`${location.origin}${pathname}`);
  }, [pathname]);
  // Cada link compartido viaja con su origen: cuando alguien llega por un
  // link de WhatsApp, el panel lo sabe (utm_source=compartir).
  const urlCon = (metodo: string) =>
    url ? `${url}${url.includes("?") ? "&" : "?"}utm_source=compartir&utm_medium=${metodo}` : url;
  const mensaje = `${titulo} — ${frase}: ${urlCon("whatsapp")}`;
  // Pastillas en lila de marca con letra blanca (mismo tratamiento que el
  // kicker y el CTA de campaña), cada una con su icono.
  const pill =
    "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-lilac px-5 py-2.5 text-sm font-bold text-ink shadow-[0_10px_24px_-10px_rgba(26,21,38,0.45)] transition-[filter] duration-200 hover:brightness-110";

  return (
    <div className="mt-10 border-y border-rule py-5">
      <p className="label text-faint">{etiqueta}</p>
      <p aria-live="polite" className="sr-only">
        {copiado ? "Enlace copiado al portapapeles." : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("share_click", { metodo: "whatsapp", path: pathname ?? "" })}
          className={pill}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
          </svg>
          WhatsApp
        </a>
        <button
          type="button"
          onClick={async () => {
            track("share_click", { metodo: "copiar", path: pathname ?? "" });
            try {
              await navigator.clipboard.writeText(urlCon("copiar"));
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              /* clipboard bloqueado */
            }
          }}
          className={pill}
        >
          {copiado ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
          {copiado ? "¡Copiado!" : "Copiar link"}
        </button>
        {tieneNativo ? (
          <button
            type="button"
            onClick={() => {
              track("share_click", { metodo: "nativo", path: pathname ?? "" });
              navigator.share({ title: titulo, url: urlCon("nativo") }).catch(() => {});
            }}
            className={pill}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="m16 6-4-4-4 4" />
              <path d="M12 2v13" />
            </svg>
            Más opciones
          </button>
        ) : null}
      </div>
    </div>
  );
}
