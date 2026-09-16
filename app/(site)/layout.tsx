import { Masthead } from "@/components/masthead";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { RevealObserver } from "@/components/reveal-observer";
import { CookieBanner } from "@/components/cookie-banner";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { VolverArriba } from "@/components/volver-arriba";

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
      <main id="contenido" className="min-h-dvh">
        {children}
      </main>
      {/* El footer NO va dentro de <main>: semánticamente no es "contenido
          principal", solo su hermano. El padding-bottom que antes llevaba
          <main> (espacio para no tapar el footer con el bottom-nav fijo en
          celular) se mueve a este envoltorio para no cambiar el look. */}
      <div className="pb-20 md:pb-0">
        <SiteFooter />
      </div>
      <MobileNav />
      <CookieBanner />
      <VolverArriba />
      <AnalyticsProvider />
    </>
  );
}
