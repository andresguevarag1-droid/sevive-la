import Link from "next/link";
import type { Transmision } from "@/lib/sanity/transmision";

/**
 * Banda "🔴 EN VIVO" del home — aparece SOLO mientras el interruptor de la
 * transmisión esté encendido en el Studio. Magenta = acción (regla del
 * sistema de diseño): esta banda pide un clic ahora.
 */
export function BandaEnVivo({ transmision }: { transmision: Transmision }) {
  return (
    <Link
      href="/en-vivo"
      className="block bg-brand text-brand-ink"
      aria-label={`En vivo: ${transmision.titulo}. Ver la transmisión.`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
        </span>
        <span className="label shrink-0">En vivo</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {transmision.titulo}
        </span>
        <span className="label shrink-0 underline underline-offset-4">Ver ahora</span>
      </div>
    </Link>
  );
}
