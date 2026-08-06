"use client";

/**
 * Capa de medición del sitio (D1/D3/D6):
 * - Vercel Analytics + Speed Insights: sin cookies, corren siempre.
 * - PostHog: SOLO si hay configuración y la persona consintió. Proxy en /ingest.
 * - Captura la atribución first-touch y emite page_view / section_view /
 *   event_detail_view en cada cambio de ruta.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { verticals } from "@/lib/site";
import { captureAttribution } from "@/lib/analytics/attribution";
import { CONSENT_EVENT, getConsentimiento } from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/track";

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

  // Atribución first-touch y PostHog: SOLO tras consentir analítica
  // (el banner promete "solo si aceptás" — y se cumple).
  useEffect(() => {
    if (getConsentimiento()?.analitica) {
      captureAttribution();
      cargarPostHog();
    }
    const alConsentir = (e: Event) => {
      const detalle = (e as CustomEvent<{ analitica?: boolean }>).detail;
      if (detalle?.analitica) {
        captureAttribution();
        cargarPostHog();
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
    </>
  );
}
