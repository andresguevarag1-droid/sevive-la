import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

// Fuentes self-hosted (Fontsource) para builds deterministas y cero fetch externo.
// Display agresiva para titulares; body legible. Ambas variables por eje de peso.
const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  variable: "--font-archivo",
  weight: "600 900",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter-var.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

// Serif editorial (solo destaques y citas — carga mínima).
const playfair = localFont({
  src: "./fonts/playfair-italic-var.woff2",
  variable: "--font-playfair",
  weight: "400 800",
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // permite pintar bajo el notch/safe-area (bottom-nav tipo app)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${inter.variable} ${playfair.variable}`}
    >
      <body>
        <SiteHeader />
        {/* padding inferior deja espacio al bottom-nav móvil */}
        <main className="min-h-dvh pb-24 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
