"use client";

/**
 * Envoltorio que hace MEDIBLE cualquier módulo de recirculación: captura
 * los clics en links internos de sus hijos (aunque sean componentes de
 * servidor) y emite recirc_click con el módulo y el destino.
 */
import type { ReactNode } from "react";
import { track } from "@/lib/analytics/track";

export function TrackClicks({
  module: modulo,
  children,
}: {
  /** Identificador estable del módulo (ej. "cronica_segui_leyendo"). */
  module: string;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (a?.getAttribute("href")?.startsWith("/")) {
          track("recirc_click", {
            module: modulo,
            href: a.getAttribute("href") ?? "",
          });
        }
      }}
    >
      {children}
    </div>
  );
}
