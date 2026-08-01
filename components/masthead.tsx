import Link from "next/link";
import { verticals } from "@/lib/site";
import { SearchIcon } from "@/components/icons";

/**
 * Masthead de periódico sobre banda lila de marca (#A190D2):
 * fila de servicio, LOGOTIPO GRANDE CENTRADO y franja de secciones.
 * El logo scrollea con la página; la franja de secciones queda fija arriba.
 */
export function Masthead() {
  return (
    <>
      <header className="border-b border-black/10 bg-lilac pt-safe">
        {/* fila de servicio */}
        <div className="mx-auto hidden max-w-6xl items-center justify-between px-4 py-1.5 text-[11px] text-ink/60 md:flex">
          <span className="tnum uppercase tracking-wider">San José, Costa Rica</span>
          <span className="uppercase tracking-wider">Guía viva de la región</span>
        </div>

        {/* logotipo centrado, protagonista */}
        <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-4 md:py-6">
          <Link href="/" aria-label="SeViveLa · Inicio" className="pressable block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="SeViveLa"
              width={96}
              height={96}
              className="h-16 w-16 md:h-24 md:w-24"
            />
          </Link>
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink hover:bg-white/25 md:right-4"
          >
            <SearchIcon width={21} height={21} />
          </Link>
        </div>
      </header>

      {/* franja de secciones — fija al hacer scroll */}
      <nav
        aria-label="Secciones"
        className="sticky top-0 z-40 border-b border-[color:var(--color-lilac-soft)] bg-lilac"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
          {verticals.map((v) => (
            <Link
              key={v.slug}
              href={`/${v.slug}`}
              className="ulink shrink-0 whitespace-nowrap text-[13px] font-medium text-ink/85 hover:text-ink"
            >
              {v.name}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
