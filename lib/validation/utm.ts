/**
 * Fragmento Zod (v4) de atribución de origen — compartido por los esquemas
 * que aceptan `utm` (misma forma que `Atribucion` en lib/analytics).
 */
import { z } from "zod";

export const utmSchema = z
  .object({
    source: z.string().max(80).optional(),
    medium: z.string().max(80).optional(),
    content: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    term: z.string().max(120).optional(),
    referrer: z.string().max(200).optional(),
    landing: z.string().max(120).optional(),
  })
  .partial()
  .optional();
