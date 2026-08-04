/**
 * Esquema Zod (v4) del interés en un evento pasado ("avisame de la próxima").
 * El servidor SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";

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
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  utm: z
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
    .optional(),
});

export type InteresEventoInput = z.infer<typeof interesEventoSchema>;
