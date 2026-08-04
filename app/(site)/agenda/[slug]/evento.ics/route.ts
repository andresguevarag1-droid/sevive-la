/**
 * Archivo .ics del evento (R3): "Agregar al calendario" para Apple/Outlook.
 * El calendario le recuerda el plan a la persona el día que importa — y la
 * trae de vuelta.
 */
import { getEvento } from "@/lib/sanity/evento";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/** ISO → formato básico UTC de iCalendar (YYYYMMDDTHHMMSSZ). */
function fmtIcs(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapa texto para iCalendar (comas, puntos y comas, saltos). */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const e = await getEvento(slug);
  if (!e) return new Response("No encontrado", { status: 404 });

  // Sin hora de cierre oficial: bloque de 2 horas (estándar razonable).
  const fin = e.fin ?? new Date(new Date(e.inicio).getTime() + 2 * 3600000).toISOString();
  const url = `${site.url}/agenda/${e.slug}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SeViveLa//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.slug}@${site.domain}`,
    `DTSTAMP:${fmtIcs(new Date().toISOString())}`,
    `DTSTART:${fmtIcs(e.inicio)}`,
    `DTEND:${fmtIcs(fin)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.lugar ? [`LOCATION:${esc(e.lugar)}`] : []),
    `DESCRIPTION:${esc(`${e.descripcion ?? e.title} — Agenda de SeViveLa: ${url}`)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
