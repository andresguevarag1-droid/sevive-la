"use client";

/**
 * Franja de secciones pegajosa, que ORIENTA:
 * - La sección activa se subraya con el color de su vertical (aria-current).
 * - Al scrollear aparece un mini-logo que lleva a la portada.
 * - Cada clic emite nav_click (instrumentación de navegación).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { verticalsVisibles } from "@/lib/site";
import { track } from "@/lib/analytics/track";

export function NavSecciones() {
  const pathname = usePathname();
  const [conLogo, setConLogo] = useState(false);

  // El mini-logo aparece cuando el logotipo grande ya salió de pantalla.
  useEffect(() => {
    let ticking = false;
    const medir = () => {
      ticking = false;
      setConLogo(window.scrollY > 140);
    };
    const alScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(medir);
      }
    };
    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-2.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
      {/* mini-logo: salida a casa sin scrollear de vuelta */}
      <Link
        href="/"
        aria-label="SeViveLa · Inicio"
        onClick={() => track("nav_click", { item: "logo_strip", nav: "top" })}
        className="shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-[var(--ease-out)]"
        style={{ width: conLogo ? 28 : 0, opacity: conLogo ? 1 : 0 }}
        tabIndex={conLogo ? 0 : -1}
        aria-hidden={!conLogo}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7" />
      </Link>

      {verticalsVisibles.map((v) => {
        const activa = pathname === `/${v.slug}` || pathname.startsWith(`/${v.slug}/`);
        return (
          <Link
            key={v.slug}
            href={`/${v.slug}`}
            aria-current={activa ? "page" : undefined}
            onClick={() => track("nav_click", { item: v.slug, nav: "top" })}
            className={`shrink-0 whitespace-nowrap border-b-2 pb-0.5 text-[13px] font-medium transition-colors ${
              activa ? "text-ink" : "ulink border-transparent text-ink/85 hover:text-ink"
            }`}
            style={activa ? { borderColor: v.colorVar } : undefined}
          >
            {v.name}
          </Link>
        );
      })}
    </div>
  );
}
