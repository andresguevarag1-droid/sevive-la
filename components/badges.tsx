import type { ContentType } from "@/lib/content";
import { typeLabel } from "@/lib/content";

/** Punto de color de vertical. */
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color }}
    />
  );
}

/** Pill con el tipo de contenido (Artículo, Evento, Video…). */
export function TypeBadge({ type }: { type: ContentType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
      {typeLabel[type]}
    </span>
  );
}

/** Etiqueta obligatoria de contenido patrocinado (legal + ético). */
export function SponsoredTag({ by }: { by: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
      Patrocinado · {by}
    </span>
  );
}
