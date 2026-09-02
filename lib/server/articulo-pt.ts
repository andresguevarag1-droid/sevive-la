/**
 * Utilidades compartidas del pipeline editorial automático:
 * ArticuloRedactado ⇄ Portable Text, y minutos de lectura.
 * Las usan el cron de artículos (crear) y el revisor (corregir/publicar).
 */
import type { ArticuloRedactado } from "@/lib/server/redaccion";

let contadorKey = 0;
const key = () => `auto${(++contadorKey).toString(36)}${Date.now().toString(36)}`;

/** Secciones del artículo → Portable Text (bloques normal + h2). */
export function aPortableText(articulo: ArticuloRedactado) {
  const bloques: Record<string, unknown>[] = [];
  for (const seccion of articulo.secciones) {
    if (seccion.subtitulo) {
      bloques.push({
        _type: "block",
        _key: key(),
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: key(), text: seccion.subtitulo, marks: [] }],
      });
    }
    for (const parrafo of seccion.parrafos) {
      if (!parrafo.trim()) continue;
      bloques.push({
        _type: "block",
        _key: key(),
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: key(), text: parrafo, marks: [] }],
      });
    }
  }
  return bloques;
}

type BloquePT = {
  _type?: string;
  style?: string;
  children?: { text?: string }[];
};

/**
 * Portable Text → secciones (el camino inverso). Funciona sobre los
 * cuerpos que genera el robot (h2 + normal, un span por bloque); si el
 * equipo metió otra cosa (imágenes, citas), esos bloques se ignoran y
 * el llamador decide si el artículo es apto para revisión automática.
 */
export function desdePortableText(
  cuerpo: BloquePT[] | undefined
): ArticuloRedactado["secciones"] {
  const secciones: ArticuloRedactado["secciones"] = [];
  let actual: ArticuloRedactado["secciones"][number] | null = null;
  for (const bloque of cuerpo ?? []) {
    if (bloque._type !== "block") continue;
    const texto = (bloque.children ?? []).map((c) => c.text ?? "").join("");
    if (!texto.trim()) continue;
    if (bloque.style === "h2") {
      actual = { subtitulo: texto, parrafos: [] };
      secciones.push(actual);
    } else {
      if (!actual) {
        actual = { subtitulo: null, parrafos: [] };
        secciones.push(actual);
      }
      actual.parrafos.push(texto);
    }
  }
  return secciones;
}

export function minutosLectura(articulo: ArticuloRedactado): number {
  const palabras = articulo.secciones
    .flatMap((s) => s.parrafos)
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
}
