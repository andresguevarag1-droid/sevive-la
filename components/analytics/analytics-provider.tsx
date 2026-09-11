"use client";

/**
 * Capa de medición del sitio (D1/D3/D6):
 * - Vercel Analytics + Speed Insights: sin cookies, corren siempre.
 * - PostHog: SOLO si hay configuración y la persona consintió. Proxy en /ingest.
 * - Captura la atribución first-touch y emite page_view / section_view /
 *   event_detail_view en cada cambio de ruta.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { verticals } from "@/lib/site";
import { captureAttribution } from "@/lib/analytics/attribution";
import { CONSENT_EVENT, getConsentimiento } from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/track";

/**
 * Meta Pixel: mismo id público en todo el sitio (no es secreto, viaja en el
 * HTML de cualquier página con Pixel). Dormido sin NEXT_PUBLIC_META_PIXEL_ID.
 */
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Import dinámico: posthog-js pesa ~50KB y solo lo paga quien consiente.
async function cargarPostHog() {
  try {
    const { initializePostHog, default: posthog } = await import(
      "@/lib/analytics/posthog-client"
    );
    if (initializePostHog()) {
      (window as { posthog?: typeof posthog }).posthog = posthog;
    }
  } catch {
    /* telemetría nunca rompe la UI */
  }
}

export function AnalyticsProvider() {
  const pathname = usePathname();
  // Gatea el Meta Pixel (mismo criterio legal que PostHog: solo tras consentir).
  const [analiticaOk, setAnaliticaOk] = useState(false);

  // Atribución first-touch y PostHog: SOLO tras consentir analítica
  // (el banner promete "solo si aceptás" — y se cumple).
  useEffect(() => {
    if (getConsentimiento()?.analitica) {
      captureAttribution();
      cargarPostHog();
      setAnaliticaOk(true);
    }
    const alConsentir = (e: Event) => {
      const detalle = (e as CustomEvent<{ analitica?: boolean }>).detail;
      if (detalle?.analitica) {
        captureAttribution();
        cargarPostHog();
        setAnaliticaOk(true);
      }
    };
    window.addEventListener(CONSENT_EVENT, alConsentir);
    return () => window.removeEventListener(CONSENT_EVENT, alConsentir);
  }, []);

  // Profundidad de scroll (R4): 25/50/75/100 una vez por ruta.
  useEffect(() => {
    if (!pathname) return;
    const enviados = new Set<number>();
    let ticking = false;
    const medir = () => {
      ticking = false;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = ((window.scrollY / total) * 100) | 0;
      for (const umbral of [25, 50, 75, 100]) {
        if (pct >= umbral && !enviados.has(umbral)) {
          enviados.add(umbral);
          track("scroll_depth", { depth: umbral, path: pathname });
        }
      }
    };
    const alScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(medir);
      }
    };
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, [pathname]);

  // page_view por ruta + señales de interés por vertical (D6).
  useEffect(() => {
    if (!pathname) return;
    const primero = pathname.split("/")[1] ?? "";
    const vertical = verticals.find((v) => v.slug === primero)?.slug;
    track("page_view", { path: pathname, ...(vertical ? { vertical } : {}) });
    if (vertical) track("section_view", { vertical });
    if (pathname.startsWith("/agenda/") && pathname.split("/").length === 3) {
      track("event_detail_view", { event_slug: pathname.split("/")[2] });
    }
  }, [pathname]);

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {analiticaOk && META_PIXEL_ID ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- fallback sin JS, next/image no aplica */}
            <img
              height="1"
              width="1"
              alt=""
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
