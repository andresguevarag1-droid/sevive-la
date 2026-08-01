"use client";

/**
 * Header inteligente:
 * - Al inicio: transparente sobre el hero.
 * - Al hacer scroll: fondo sólido con blur.
 * - Solo 3 elementos: logo, buscador, menú.
 * En desktop expone las 6 verticales; en móvil, buscador + menú (drawer viene después).
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { verticals } from "@/lib/site";
import { SearchIcon, MenuIcon } from "@/components/icons";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="fixed inset-x-0 top-0 z-40 pt-safe transition-colors duration-300 data-[scrolled=true]:border-b data-[scrolled=true]:border-line data-[scrolled=true]:bg-canvas/80 data-[scrolled=true]:backdrop-blur-lg"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" aria-label="SeViveLa · Inicio" className="shrink-0 text-ink">
          {/* logo vectorial (currentColor = blanco sobre dark) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="SeViveLa"
            width={40}
            height={40}
            className="h-9 w-9 [filter:invert(1)]"
          />
        </Link>

        {/* verticales — solo desktop */}
        <nav className="ml-2 hidden flex-1 items-center gap-5 text-sm font-medium text-muted md:flex">
          {verticals.map((v) => (
            <Link
              key={v.slug}
              href={`/${v.slug}`}
              className="transition-colors hover:text-ink"
            >
              {v.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
          >
            <SearchIcon />
          </Link>
          <button
            type="button"
            aria-label="Menú"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
