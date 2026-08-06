import type { CSSProperties } from "react";
import type { VerticalSlug } from "@/lib/site";
import { getVertical } from "@/lib/site";
import { verticalColor, verticalColorTexto, typeLabel, type ContentType } from "@/lib/content";

/**
 * Marca de categoría como chip de color: tinte claro del color de la vertical
 * + texto en ese color. Aporta color moderno sin fondos de degradado.
 */
export function CategoryLabel({
  vertical,
  type,
  className = "",
}: {
  vertical: VerticalSlug;
  type?: ContentType;
  className?: string;
}) {
  const v = getVertical(vertical);
  const color = verticalColor(vertical);
  const style: CSSProperties = {
    // Texto oscurecido (AA) sobre el tinte claro del color original.
    color: verticalColorTexto(vertical),
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
  };
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="chip" style={style}>
        {v?.name}
      </span>
      {type ? (
        <span className="label text-faint">{typeLabel[type]}</span>
      ) : null}
    </span>
  );
}
