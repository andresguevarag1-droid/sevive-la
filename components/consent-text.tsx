import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renderiza el texto EXACTO del consentimiento (lib/consent.ts) convirtiendo
 * en enlace las frases que ya viven dentro del texto («Política de
 * Privacidad» y, si aplica, «bases de la dinámica»), sin agregar ni quitar
 * una palabra: lo que la persona ve es idéntico a lo que se guarda como
 * prueba en `consents.consent_text` (Ley 8968). Antes el enlace se
 * concatenaba después del punto final ("…en cualquier momento. Política de
 * Privacidad."), que leía raro y no quedaba en la prueba.
 */
export function ConsentText({
  text,
  basesHref,
}: {
  text: string;
  /** Página de bases legales, para enlazar «bases de la dinámica». */
  basesHref?: string;
}) {
  const enlaces: [string, string][] = [["Política de Privacidad", "/legal/privacidad"]];
  if (basesHref) enlaces.push(["bases de la dinámica", basesHref]);

  const nodos: ReactNode[] = [];
  let resto = text;
  let key = 0;
  // En cada vuelta se enlaza la frase que aparezca primero en lo que queda.
  for (;;) {
    let mejor: { i: number; frase: string; href: string } | null = null;
    for (const [frase, href] of enlaces) {
      const i = resto.indexOf(frase);
      if (i !== -1 && (mejor === null || i < mejor.i)) mejor = { i, frase, href };
    }
    if (!mejor) break;
    if (mejor.i > 0) nodos.push(resto.slice(0, mejor.i));
    nodos.push(
      <Link key={key++} href={mejor.href} className="underline" target="_blank">
        {mejor.frase}
      </Link>
    );
    resto = resto.slice(mejor.i + mejor.frase.length);
  }
  if (resto) nodos.push(resto);
  return <>{nodos}</>;
}
