import { Masthead } from "@/components/masthead";
import { MobileNav } from "@/components/mobile-nav";

/**
 * Chrome del sitio público: masthead + contenido + bottom-nav móvil.
 * Envuelve todas las rutas del sitio, pero NO al Studio (/studio).
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Masthead />
      <main className="min-h-dvh pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </>
  );
}
