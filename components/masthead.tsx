import Link from "next/link";
import { verticals } from "@/lib/site";
import { SearchIcon, MenuIcon } from "@/components/icons";

/**
 * Masthead de revista sobre banda lila de marca (#A190D2):
 * fila de servicio, logotipo y navegación de secciones. Fija arriba.
 */
export function Masthead() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-lilac-soft)] bg-lilac pt-safe">
      {/* fila de servicio */}
      <div className="mx-auto hidden max-w-6xl items-center justify-between px-4 py-1.5 text-[11px] text-ink/60 md:flex">
        <span className="tnum uppercase tracking-wider">San José, Costa Rica</span>
        <span className="uppercase tracking-wider">Guía viva de la región</span>
      </div>

      <div className="border-t border-black/10 md:border-t-0">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/" aria-label="SeViveLa · Inicio" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SeViveLa" width={36} height={36} className="h-8 w-8" />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {verticals.map((v) => (
              <Link
                key={v.slug}
                href={`/${v.slug}`}
                className="ulink text-[13px] font-medium text-ink/85 hover:text-ink"
              >
                {v.name}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href="/buscar"
              aria-label="Buscar"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white/25"
            >
              <SearchIcon width={20} height={20} />
            </Link>
            <button
              type="button"
              aria-label="Menú"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white/25 md:hidden"
            >
              <MenuIcon width={20} height={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
