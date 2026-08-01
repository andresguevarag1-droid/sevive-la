/**
 * Esquema Zod (v4) de participación en dinámica — compartido entre cliente y servidor.
 * El servidor SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";

export const dinamicaEntrySchema = z.object({
  /** Slug de la dinámica (documento en Sanity + fila en `dynamics`). */
  slug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Slug inválido."),
  firstName: z.string().trim().min(2, "Contanos tu nombre.").max(80),
  email: z.email("Escribí un correo válido.").trim().toLowerCase().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{8,20}$/, "Escribí un teléfono válido.")
    .optional()
    .or(z.literal("")),
  /** Respuesta a la pregunta de la dinámica (si la hay). */
  answer: z.string().trim().max(500).optional().or(z.literal("")),
  /** Debe ser true: checkbox de consentimiento (nunca premarcado). */
  consent: z.literal(true, "Necesitamos tu consentimiento para participar."),
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
});

export type DinamicaEntryInput = z.infer<typeof dinamicaEntrySchema>;
