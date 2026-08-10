/**
 * Esquema Zod (v4) del interés en un evento pasado ("avisame de la próxima").
 * El servidor SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";
import { utmSchema } from "@/lib/validation/utm";

export const interesEventoSchema = z.object({
  eventSlug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Evento inválido."),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Escribí un correo válido.")),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  /** Debe ser true: checkbox de consentimiento (nunca premarcado). */
  consent: z.literal(true, "Necesitamos tu consentimiento para avisarte."),
  /** Variante del formulario que la persona VIO (determina el texto de
   *  consentimiento a registrar; el servidor valida su coherencia). */
  variante: z.enum(["evento", "cronica", "proximo"]).optional(),
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  utm: utmSchema,
});

export type InteresEventoInput = z.infer<typeof interesEventoSchema>;
