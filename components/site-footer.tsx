import Link from "next/link";
import { site, verticals } from "@/lib/site";

const legal = [
  { href: "/dinamicas", label: "Dinámicas" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/terminos", label: "Términos" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/marcas", label: "Marcas" },
  { href: "/nosotros", label: "Nosotros" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="SeViveLa" width={40} height={40} className="h-9 w-9" />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Guía viva de experiencias, cultura y gastronomía de Costa Rica.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {verticals.map((v) => (
              <Link key={v.slug} href={`/${v.slug}`} className="ulink text-ink/80 hover:text-ink">
                {v.name}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2 text-sm">
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="ulink text-muted hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="label mt-10 text-faint">
          © {new Date().getFullYear()} {site.name} · Hecho en Costa Rica
        </p>
      </div>
    </footer>
  );
}
