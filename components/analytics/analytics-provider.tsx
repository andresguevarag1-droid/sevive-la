"use client";

/**
 * Capa de medición del sitio (D1/D3/D6):
 * - Vercel Analytics + Speed Insights: sin cookies, corren siempre.
 * - PostHog: SOLO si hay NEXT_PUBLIC_POSTHOG_KEY y la persona consintió
 *   (import dinámico: cero bytes para quien no acepta). Proxy en /ingest.
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

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

let posthogCargado = false;

async function cargarPostHog() {
  if (posthogCargado || !POSTHOG_KEY) return;
  posthogCargado = true;
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      capture_pageview: false, // App Router: lo emitimos a mano por ruta
      person_profiles: "identified_only",
      autocapture: false, // taxonomía explícita, no ruido
    });
    (window as { posthog?: unknown }).posthog = posthog;
  } catch {
    posthogCargado = false;
  }
}

export function AnalyticsProvider() {
  const pathname = usePathname();

  // Atribución first-touch + PostHog si ya había consentimiento previo.
  useEffect(() => {
    captureAttribution();
    if (getConsentimiento()?.analitica) void cargarPostHog();
    const alConsentir = (e: Event) => {
      const detalle = (e as CustomEvent<{ analitica?: boolean }>).detail;
      if (detalle?.analitica) void cargarPostHog();
    };
    window.addEventListener(CONSENT_EVENT, alConsentir);
    return () => window.removeEventListener(CONSENT_EVENT, alConsentir);
  }, []);

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
