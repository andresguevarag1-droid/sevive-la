/**
 * Datos estructurados (JSON-LD) para SEO enriquecido y GEO (motores de IA).
 * Server component: cero JS en el cliente.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // El contenido viene del CMS: se escapan <, > y & para que un título con
  // "</script>" no pueda romper el bloque e inyectar script en la página.
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
