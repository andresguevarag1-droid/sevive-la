import type { CSSProperties, ReactNode } from "react";
import type { VerticalSlug } from "@/lib/site";
import { verticalColor } from "@/lib/content";

/**
 * Placeholder de "foto" con el color de la vertical + scrim inferior para
 * que el texto blanco encima siempre sea legible (sin depender de color-mix,
 * por compatibilidad con el webview in-app de IG/TikTok).
 * En producción se reemplaza por next/image con la imagen real.
 */
export function MediaBlock({
  vertical,
  className = "",
  children,
  aspect,
}: {
  vertical: VerticalSlug;
  className?: string;
  children?: ReactNode;
  aspect?: string;
}) {
  const style: CSSProperties = {
    background: verticalColor(vertical),
    aspectRatio: aspect,
  };
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={style}
    >
      {/* textura sutil + oscurecido para legibilidad */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
