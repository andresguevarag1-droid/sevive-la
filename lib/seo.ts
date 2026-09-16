/**
 * Tope de longitud para meta descriptions: evita que Google/redes corten
 * a mitad de palabra un texto armado por concatenación (premio, detalle,
 * instrucciones de canje, etc.). Reutilizado en las páginas de detalle
 * que arman su descripción a partir de campos de Sanity.
 */
export function capDescription(texto: string, max = 170): string {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max - 3).trimEnd()}…`;
}
