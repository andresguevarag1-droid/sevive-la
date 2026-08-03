/**
 * Esquemas Zod (v4) del panel de administración — SOLO SERVIDOR.
 */
import { z } from "zod";

export const crearLocalSchema = z.object({
  name: z.string().trim().min(2, "Poné el nombre del local.").max(80),
  /** Correo del local para enviarle el PIN (opcional). */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .pipe(z.email("Escribí un correo válido."))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  /** Beneficios que este local puede canjear (vacío = todos). */
  benefitSlugs: z
    .array(z.string().trim().min(1).max(96).regex(/^[a-z0-9-]+$/))
    .max(50)
    .default([]),
});

export const regenerarPinSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9-]+$/, "Local inválido."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .pipe(z.email("Escribí un correo válido."))
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
