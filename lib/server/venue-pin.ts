/**
 * Envío del PIN de canje al correo del local — SOLO SERVIDOR.
 * Nunca es fatal: el PIN siempre vuelve en la respuesta del panel para
 * copiarlo a mano; el correo es una comodidad (dormido hasta activar Resend).
 */
import "server-only";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { emailEnabled, enviarCorreo, plantillaPinLocal } from "@/lib/server/email";

export async function enviarPinPorCorreo(
  email: string | undefined,
  nombre: string,
  pin: string,
  benefitSlugs: string[]
): Promise<{ correoEnviado: boolean; correoMotivo?: string }> {
  if (!email) return { correoEnviado: false, correoMotivo: "sin_correo" };
  if (!emailEnabled) return { correoEnviado: false, correoMotivo: "resend_inactivo" };
  try {
    let titulos: string[] = [];
    if (benefitSlugs.length && sanityConfigured) {
      const raw = await client.fetch<{ title: string; marca?: string }[]>(
        /* groq */ `*[_type == "beneficio" && slug.current in $slugs]{ title, marca }`,
        { slugs: benefitSlugs },
        { next: { revalidate: 60 } }
      );
      titulos = (raw ?? []).map((b) => (b.marca ? `${b.title} — ${b.marca}` : b.title));
    }
    await enviarCorreo(email, plantillaPinLocal({ nombre, pin, beneficios: titulos }));
    return { correoEnviado: true };
  } catch (err) {
    console.error("[admin] correo del PIN falló (no fatal):", err);
    return { correoEnviado: false, correoMotivo: "fallo_envio" };
  }
}
