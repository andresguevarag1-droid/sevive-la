/**
 * Imagen editorial: fotografía real, esquinas rectas (nada de degradados de
 * relleno). Fallback tipográfico limpio si aún no hay imagen.
 * En producción se reemplaza por next/image con las imágenes de Sanity.
 */
export function EditorialImage({
  src,
  alt,
  ratio,
  className = "",
  priority = false,
}: {
  src?: string;
  alt: string;
  ratio?: string;
  className?: string;
  priority?: boolean;
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
          alt={alt}
          className="h-full w-full object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="label text-faint">SeViveLa</span>
        </div>
      )}
    </div>
  );
}
