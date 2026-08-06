import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Cliente de lectura para el sitio público. `useCdn: true` sirve desde el CDN
 * de Sanity (rápido); la frescura la maneja el `revalidate` de cada fetch.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});
