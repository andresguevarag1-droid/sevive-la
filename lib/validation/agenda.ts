/**
 * Esquema Zod (v4) del respaldo de "Mi agenda" por correo.
 * El servidor SIEMPRE re-valida (regla dura del proyecto).
 */
import { z } from "zod";
import { utmSchema } from "@/lib/validation/utm";

export const respaldoAgendaSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Escribí un correo válido.")),
  /** Debe ser true: checkbox de consentimiento (nunca premarcado). */
  consent: z.literal(true, "Necesitamos tu consentimiento para respaldar tu agenda."),
  /** Los guardados del dispositivo (snapshot de localStorage). */
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(96).regex(/^[a-z0-9-]+$/, "Evento inválido."),
        title: z.string().trim().min(1).max(160),
        inicio: z.string().trim().max(40).optional().or(z.literal("")),
        lugar: z.string().trim().max(120).optional().or(z.literal("")),
        vertical: z.string().trim().max(40).regex(/^[a-z-]+$/, "Vertical inválida."),
      })
    )
    .min(1, "No hay nada guardado que respaldar.")
    .max(100),
  /** Token de Cloudflare Turnstile (si está habilitado). */
  turnstileToken: z.string().optional(),
  /** Honeypot anti-bot: debe venir vacío. */
  website: z.literal("").optional(),
  utm: utmSchema,
});

export type RespaldoAgendaInput = z.infer<typeof respaldoAgendaSchema>;

/** Pedir el link mágico para recuperar la agenda en otro dispositivo. */
export const recuperarAgendaSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Escribí un correo válido.")),
  turnstileToken: z.string().optional(),
  website: z.literal("").optional(),
});

export type RecuperarAgendaInput = z.infer<typeof recuperarAgendaSchema>;
