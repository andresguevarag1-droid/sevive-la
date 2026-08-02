/**
 * Esquemas Zod (v4) de cupones — SOLO SERVIDOR es la fuente de verdad.
 */
import { z } from "zod";

export const reclamarSchema = z.object({
  benefitSlug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Beneficio inválido."),
  email: z.string().trim().toLowerCase().max(120).pipe(z.email("Escribí un correo válido.")),
  /** Checkbox de consentimiento: obligatorio, nunca premarcado. */
  consent: z.literal(true, "Necesitamos tu consentimiento para emitir el cupón."),
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  utm: z
    .object({
      source: z.string().max(80).optional(),
      medium: z.string().max(80).optional(),
      content: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
    })
    .partial()
    .optional(),
});

export const canjearSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^SV-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Código inválido."),
  venueToken: z.string().trim().min(8, "Falta el PIN del local.").max(200),
});
