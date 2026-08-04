import { verticalColor } from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";

/**
 * Fondo de marca para un reel sin miniatura: bloque sólido en el color de
 * la vertical con la marca de agua SEVIVELA en vertical (misma micro-firma
 * de imprenta que los cupones). El scrim, la categoría, el play y el título
 * de la tarjeta se dibujan encima igual que con foto — nada se rompe.
 */
export function ReelSinFoto({ vertical }: { vertical: VerticalSlug }) {
  return (
    <div
      aria-hidden
      className="relative h-full w-full"
      style={{ background: verticalColor(vertical) }}
    >
      <span
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xl font-black uppercase tracking-[0.4em] text-white/20"
        style={{ writingMode: "vertical-rl" }}
      >
        SeViveLa
      </span>
    </div>
  );
}
