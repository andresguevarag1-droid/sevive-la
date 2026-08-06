/**
 * Esquema Zod (v4) del alta al boletín — compartido entre cliente y servidor.
 * El servidor SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";
import { utmSchema } from "@/lib/validation/utm";

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Escribí un correo válido.")),
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  /** Debe ser true: checkbox de consentimiento (nunca premarcado). */
  consent: z.literal(true, "Necesitamos tu consentimiento para suscribirte."),
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  /** Atribución de origen (qué canal trajo a la persona). */
  utm: utmSchema,
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
