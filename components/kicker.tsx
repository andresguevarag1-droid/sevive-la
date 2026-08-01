import type { VerticalSlug } from "@/lib/site";
import { getVertical } from "@/lib/site";
import { verticalColor, typeLabel, type ContentType } from "@/lib/content";

/**
 * Marca de categoría editorial: punto de color de la vertical + nombre + tipo.
 * El color de vertical vive aquí (marca funcional), no como fondo de tarjeta.
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
  return (
    <span className={`label inline-flex items-center gap-2 text-ink ${className}`}>
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: verticalColor(vertical) }}
      />
      {v?.name}
      {type ? <span className="text-faint">· {typeLabel[type]}</span> : null}
    </span>
  );
}
