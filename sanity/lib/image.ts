import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { dataset, projectId } from "@/sanity/env";

const builder = imageUrlBuilder({ projectId, dataset });

/**
 * Construye la URL de una imagen de Sanity. Devuelve undefined si no hay imagen,
 * para que los componentes muestren su estado vacío/fallback.
 */
export function urlForImage(
  source: SanityImageSource | undefined | null,
  width = 1200
): string | undefined {
  if (!source || !(source as { asset?: unknown }).asset) return undefined;
  return builder.image(source).width(width).auto("format").fit("max").url();
}
