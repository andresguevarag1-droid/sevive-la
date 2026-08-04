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

  const clase =
    "pressable inline-flex min-h-11 items-center justify-center border border-rule px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={gcal}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("add_to_calendar", { event_slug: slug, metodo: "google" })}
        className={clase}
      >
        + Google Calendar
      </a>
      <a
        href={`/agenda/${slug}/evento.ics`}
        onClick={() => track("add_to_calendar", { event_slug: slug, metodo: "ics" })}
        className={clase}
      >
        + Apple / Outlook
      </a>
    </div>
  );
}
