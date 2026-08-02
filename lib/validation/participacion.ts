/**
 * Esquema Zod (v4) de participación en campaña — SOLO SERVIDOR es la fuente
 * de verdad (el cliente usa validaciones ligeras de lib/validation/client.ts).
 * Réplica del contrato del Google Form de la campaña + legal + anti-abuso.
 */
import { z } from "zod";
import { PROVINCIAS_CR } from "@/lib/validation/client";

export const participacionSchema = z.object({
  campaignSlug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Campaña inválida."),
  email: z.email("Escribí un correo válido.").trim().toLowerCase().max(120),
  fullName: z.string().trim().min(2, "Contanos tu nombre completo.").max(80),
  residence: z.enum(PROVINCIAS_CR, "Elegí tu provincia."),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{8,20}$/, "Escribí un teléfono válido.")
    .optional()
    .or(z.literal("")),
  isOver21: z.boolean(),
  hasPassport: z.boolean(),
  hasUsVisa: z.boolean(),
  followsIg: z.boolean().optional().default(false),
  /** Checkboxes legales: obligatorios, nunca premarcados. */
  consent: z.literal(true, "Necesitamos tu consentimiento para participar."),
  acceptsRules: z.literal(true, "Tenés que aceptar las bases y condiciones."),
  /** Código de referido con el que llegó (?ref=). Inválido → se ignora, no bloquea. */
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/)
    .optional()
    .or(z.literal("")),
  /** Token de Cloudflare Turnstile (exigido cuando está configurado). */
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

export type ParticipacionInput = z.infer<typeof participacionSchema>;
