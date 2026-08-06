import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site, socialLinks } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";

// Fuentes self-hosted (Fontsource) — builds deterministas, cero fetch externo.
const fraunces = localFont({
  src: "./fonts/fraunces-var.woff2",
  variable: "--font-fraunces",
  weight: "300 700",
  display: "swap",
  // Solo titulares: no compite con la imagen LCP en el preload.
  preload: false,
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
  // Sin title/description absolutos en og/twitter: si el raíz los fija,
  // Next deja de derivarlos por página y TODO share muestra el de la home.
  openGraph: {
    type: "website",
    locale: "es_CR",
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#a190d2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Layout raíz: solo html/body y fuentes. El "chrome" del sitio (masthead,
 * navegación) vive en app/(site)/layout.tsx, para que /studio se renderice limpio.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CR" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        {/* La imagen LCP vive en cdn.sanity.io: el handshake arranca ya. */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body>
        {/* Entidad y sitio para SEO/GEO (motores de búsqueda y de IA) */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.name,
            url: site.url,
            logo: `${site.url}/logo.svg`,
            description: site.description,
            areaServed: { "@type": "Country", name: "Costa Rica" },
            sameAs: socialLinks.map((s) => s.href),
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            inLanguage: site.locale,
            potentialAction: {
              "@type": "SearchAction",
              target: `${site.url}/buscar?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
