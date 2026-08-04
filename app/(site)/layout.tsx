import { Masthead } from "@/components/masthead";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { RevealObserver } from "@/components/reveal-observer";
import { CookieBanner } from "@/components/cookie-banner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

/**
 * Chrome del sitio público: masthead + contenido + footer + bottom-nav móvil.
 * Envuelve todas las rutas del sitio, pero NO al Studio (/studio).
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Salto al contenido para navegación por teclado / lectores */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-ink"
      >
        Saltar al contenido
      </a>
      <Masthead />
      <RevealObserver />
      <main id="contenido" className="min-h-dvh pb-20 md:pb-0">
        {children}
        <SiteFooter />
      </main>
      <MobileNav />
      <CookieBanner />
      <AnalyticsProvider />
    </>
  );
}
