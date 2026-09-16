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

/**
 * Relación de aspecto REAL de la imagen ("1600 / 900"), leída del propio
 * _ref del asset (Sanity codifica ancho/alto ahí: image-<id>-WxH-ext), sin
 * pedir metadata aparte. Sirve para reservar el espacio exacto y evitar
 * salto de layout (CLS) en imágenes que se muestran a su tamaño natural
 * (sin recorte, a diferencia de las tarjetas de grilla que sí cortan a
 * una relación fija).
 */
export function aspectRatioDeAsset(
  source: { asset?: { _ref?: string } } | null | undefined
): string | undefined {
  const ref = source?.asset?._ref;
  const match = ref?.match(/-(\d+)x(\d+)-/);
  if (!match) return undefined;
  return `${match[1]} / ${match[2]}`;
}
