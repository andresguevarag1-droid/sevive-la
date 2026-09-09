/**
 * Esquema Zod (v4) de participación en campaña — SOLO SERVIDOR es la fuente
 * de verdad (el cliente usa validaciones ligeras de lib/validation/client.ts).
 * Réplica del contrato del Google Form de la campaña + legal + anti-abuso.
 */
import { z } from "zod";
import { utmSchema } from "@/lib/validation/utm";
import { PROVINCIAS_CR } from "@/lib/validation/client";

export const participacionSchema = z.object({
  campaignSlug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Campaña inválida."),
  email: z.string().trim().toLowerCase().max(120).pipe(z.email("Escribí un correo válido.")),
  fullName: z.string().trim().min(2, "Contanos tu nombre completo.").max(80),
  residence: z.enum(PROVINCIAS_CR, "Elegí tu provincia."),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{8,20}$/, "Escribí un teléfono válido.")
    .optional()
    .or(z.literal("")),
  isOver21: z.boolean().nullable().optional().default(null),
  hasPassport: z.boolean().nullable().optional().default(null),
  hasUsVisa: z.boolean().nullable().optional().default(null),
  /** Solo en campañas con `pideEdad` (en vez de las preguntas sí/no de arriba). */
  edad: z.number().int().min(1).max(120).nullable().optional().default(null),
  /** Respuesta libre a la pregunta de interés opcional de la campaña (ej. tema favorito). */
  interesRespuesta: z.string().trim().max(60).nullable().optional().default(null),
  followsIg: z.boolean().optional().default(false),
  /** Checkboxes legales: obligatorios, nunca premarcados. */
  consent: z.literal(true, "Necesitamos tu consentimiento para participar."),
  acceptsRules: z.literal(true, "Tenés que aceptar las bases y condiciones."),
  /** Autorización SEPARADA y opcional de comunicaciones de marketing. */
  marketingConsent: z.boolean().optional().default(false),
  /** Código de referido con el que llegó (?ref=). Inválido → se descarta, no bloquea. */
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,12}$/)
    .optional()
    .or(z.literal(""))
    .catch(""),
  /** Token de Cloudflare Turnstile (exigido cuando está configurado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  utm: utmSchema,
});

export type ParticipacionInput = z.infer<typeof participacionSchema>;
