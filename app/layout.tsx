import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";
import { Masthead } from "@/components/masthead";
import { MobileNav } from "@/components/mobile-nav";

// Fuentes self-hosted (Fontsource) — builds deterministas, cero fetch externo.
const fraunces = localFont({
  src: "./fonts/fraunces-var.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/inter-var.woff2",
  variable: "--font-inter",
  weight: "100 900",
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
  themeColor: "#fbfaf8",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Masthead />
        <main className="min-h-dvh pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
