/**
 * Textos de consentimiento (Ley 8968, Costa Rica) — fuente de verdad única.
 * El MISMO texto que ve la persona en el formulario es el que se guarda en
 * `consents.consent_text` con su versión. Si se cambia una palabra del texto,
 * hay que subir la versión.
 *
 * Este archivo NO importa nada de servidor: se usa tanto en componentes
 * cliente (para mostrar el texto) como en route handlers (para registrarlo).
 */

export type ConsentDefinition = {
  /** Propósito registrado en la tabla `consents`. */
  purpose: string;
  /** Versión del texto (subir al cambiar el texto). */
  version: string;
  /** Texto EXACTO mostrado junto al checkbox (nunca premarcado). */
  text: string;
};

export const CONSENT_NEWSLETTER: ConsentDefinition = {
  purpose: "newsletter",
  version: "2026-08-01.v1",
  text: "Acepto que SeViveLa trate mis datos personales (correo electrónico y nombre) para enviarme su boletín con contenido y beneficios, según su Política de Privacidad. Puedo darme de baja en cualquier momento.",
};

/**
 * Consentimiento de participación en CAMPAÑA (ej. Latin Grammys 2026).
 * Texto y versión acordados con legal para esta campaña (spec lg-2026-v1).
 */
export function consentParticipacion(slug: string): ConsentDefinition {
  return {
    // Purpose propio: no colisiona con consentDinamica (texto/versión distintos).
    purpose: `campana:${slug}`,
    version: "lg-2026-v1",
    text: "Autorizo a SeViveLa a tratar mis datos personales (correo, nombre, residencia y teléfono) para gestionar mi participación en esta dinámica y enviarme comunicaciones, según su Política de Privacidad. Puedo darme de baja cuando quiera.",
  };
}

/** Consentimiento al reclamar un cupón de beneficio; el purpose lleva el slug. */
export function consentBeneficio(slug: string): ConsentDefinition {
  return {
    purpose: `beneficio:${slug}`,
    version: "2026-08-02.v1",
    text: "Acepto que SeViveLa trate mis datos personales (correo electrónico) para emitirme este cupón, medir su canje y enviarme información de beneficios similares, según su Política de Privacidad. Puedo darme de baja en cualquier momento.",
  };
}

/** Consentimiento del respaldo de "Mi agenda" por correo. */
export const CONSENT_AGENDA: ConsentDefinition = {
  purpose: "agenda",
  version: "2026-08-04.v1",
  text: "Acepto que SeViveLa trate mis datos personales (correo electrónico y mis eventos guardados) para respaldar mi agenda y avisarme sobre esos planes, según su Política de Privacidad. Puedo darme de baja en cualquier momento.",
};

/** Consentimiento de interés en la próxima edición de un evento (desde la
 *  página del evento pasado o desde una crónica de cobertura). */
export function consentInteresEvento(
  slug: string,
  tipo: "evento" | "cronica" = "evento"
): ConsentDefinition {
  return {
    purpose: `${tipo}:${slug}`,
    version: "2026-08-04.v1",
    text: "Acepto que SeViveLa trate mis datos personales (correo electrónico y nombre) para avisarme sobre próximas ediciones de este evento y planes similares, según su Política de Privacidad. Puedo darme de baja en cualquier momento.",
  };
}

/** Consentimiento de participación en dinámica; el purpose lleva el slug. */
export function consentDinamica(slug: string): ConsentDefinition {
  return {
    purpose: `dinamica:${slug}`,
    version: "2026-08-01.v1",
    text: "Acepto que SeViveLa trate mis datos personales (nombre, correo electrónico y teléfono) para gestionar mi participación en esta dinámica, contactarme si resulto ganador(a) y enviarme información relacionada, según su Política de Privacidad y las bases de la dinámica. La participación es gratuita y puedo solicitar la eliminación de mis datos en cualquier momento.",
  };
}
