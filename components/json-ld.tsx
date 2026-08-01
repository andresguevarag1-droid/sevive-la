/**
 * Datos estructurados (JSON-LD) para SEO enriquecido y GEO (motores de IA).
 * Server component: cero JS en el cliente.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify escapa el contenido; sin input de usuario aquí.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
