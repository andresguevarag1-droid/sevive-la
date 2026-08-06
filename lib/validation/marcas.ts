/**
 * Esquema Zod (v4) del formulario "Para marcas" (lead B2B) — el servidor
 * SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";
import { utmSchema } from "@/lib/validation/utm";

export const FORMATOS_MARCA = [
  "dinamica",
  "patrocinado",
  "cuponera",
  "boletin",
  "otro",
] as const;

export const marcaLeadSchema = z.object({
  brandName: z.string().trim().min(2, "Contanos el nombre de tu marca.").max(120),
  contactName: z.string().trim().min(2, "Contanos tu nombre.").max(80),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Escribí un correo válido.")),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s-]{8,20}$/, "Escribí un teléfono válido.")
    .optional()
    .or(z.literal("")),
  interest: z.enum(FORMATOS_MARCA).optional(),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  /** Atribución de origen de la consulta. */
  utm: utmSchema,
});

export type MarcaLeadInput = z.infer<typeof marcaLeadSchema>;
