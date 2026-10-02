/**
 * Imagen editorial: fotografía real, esquinas rectas (nada de degradados de
 * relleno). Sin foto todavía, cae a un bloque de marca del color de la
 * vertical (nunca el recuadro gris vacío: mientras no haya foto real de la
 * crónica/evento, al menos queda a tono con la sección).
 * En producción se reemplaza por next/image con las imágenes de Sanity.
 */
import { verticalColorFondo } from "@/lib/content";
import type { VerticalSlug } from "@/lib/site";

/** srcset con anchos móviles/desktop para URLs del CDN de Sanity (llevan
 *  ?w=…): en un teléfono se baja ~1/4 del peso. Otras URLs quedan igual. */
function srcsetSanity(src: string): string | undefined {
  if (!src.includes("cdn.sanity.io") || !/[?&]w=\d+/.test(src)) return undefined;
  return [480, 800, 1200]
    .map((w) => `${src.replace(/([?&]w=)\d+/, `$1${w}`)} ${w}w`)
    .join(", ");
}

export function EditorialImage({
  src,
  alt,
  ratio,
  className = "",
  priority = false,
  sizes = "(min-width: 768px) 50vw, 100vw",
  vertical,
}: {
  src?: string;
  alt: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
  /** Hint de tamaño para el srcset responsivo. */
  sizes?: string;
  /** Color del bloque de marca cuando todavía no hay foto real. */
  vertical?: VerticalSlug;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] bg-paper-2 ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={srcsetSanity(src)}
          sizes={srcsetSanity(src) ? sizes : undefined}
          alt={alt}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={vertical ? { background: verticalColorFondo(vertical) } : undefined}
        >
          {vertical ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo.svg" alt="" className="h-8 w-8 opacity-90 invert" />
          ) : (
            <span className="label text-faint">SeViveLa</span>
          )}
        </div>
      )}
    </div>
  );
}
