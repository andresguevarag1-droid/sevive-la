"use client";

/**
 * "Agregar al calendario" (R3): Google Calendar por link y .ics para
 * Apple/Outlook. Cero fricción, sin login — y el recordatorio trae a la
 * persona de vuelta el día del evento.
 */
import { track } from "@/lib/analytics/track";

function fmtGcal(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function BotonesCalendario({
  slug,
  titulo,
  inicio,
  fin,
  lugar,
}: {
  slug: string;
  titulo: string;
  inicio: string;
  fin?: string;
  lugar?: string;
}) {
  const finReal = fin ?? new Date(new Date(inicio).getTime() + 2 * 3600000).toISOString();
  const gcal = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${fmtGcal(inicio)}/${fmtGcal(finReal)}`,
    ...(lugar ? { location: lugar } : {}),
    details: `Visto en la agenda de SeViveLa`,
  }).toString()}`;

  // Pastillas en lila de marca con letra blanca e icono (mismo tratamiento
  // que los botones de compartir de las crónicas).
  const pill =
    "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-lilac px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(26,21,38,0.45)] transition-[filter] duration-200 hover:brightness-110";

  const iconoCalendario = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5" />
    </svg>
  );

  return (
    <div className="flex flex-wrap gap-2.5">
      <a
        href={gcal}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("add_to_calendar", { event_slug: slug, metodo: "google" })}
        className={pill}
      >
        {iconoCalendario}
        Google Calendar
      </a>
      <a
        href={`/agenda/${slug}/evento.ics`}
        onClick={() => track("add_to_calendar", { event_slug: slug, metodo: "ics" })}
        className={pill}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m7 10 5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
        Apple / Outlook
      </a>
    </div>
  );
}
