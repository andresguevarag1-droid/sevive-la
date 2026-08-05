/**
 * Cron diario (8:00 CR): "Mañana es tu plan" — recordatorio por correo de
 * los eventos guardados que son mañana. Idempotente vía email_log (claim
 * único por persona+evento): NUNCA se envía dos veces. Dormido sin Resend.
 * Protegido con CRON_SECRET (Vercel Cron lo manda como Bearer).
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import {
  emailEnabled,
  enviarCorreo,
  plantillaRecordatorioEvento,
} from "@/lib/server/email";

export const runtime = "nodejs";
export const maxDuration = 60;

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Día calendario YYYY-MM-DD en CR. */
function diaCR(t: number | string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(
    new Date(t)
  );
}

type Fila = {
  person_id: string;
  event_slug: string;
  event_title: string;
  inicio: string | null;
  lugar: string | null;
  people: { email: string; status: string } | null;
};

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!emailEnabled) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "resend_no_configurado" });
  }
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "supabase_no_configurado" });
  }

  const manana = diaCR(Date.now() + 86400000);

  // Ventana amplia por índice; el filtro exacto es el día calendario CR.
  const { data, error } = await db
    .from("saved_events")
    .select("person_id, event_slug, event_title, inicio, lugar, people(email, status)")
    .gte("inicio", new Date(Date.now()).toISOString())
    .lte("inicio", new Date(Date.now() + 3 * 86400000).toISOString())
    .limit(500);
  if (error) {
    console.error("[cron recordatorios] consulta falló:", error);
    return NextResponse.json({ ok: false, error: "Consulta falló." }, { status: 500 });
  }

  let enviados = 0;
  let omitidos = 0;
  for (const f of (data ?? []) as unknown as Fila[]) {
    if (!f.inicio || diaCR(f.inicio) !== manana) continue;
    if (!f.people?.email || f.people.status !== "active") continue;

    // Claim idempotente: si la fila ya existe, otro run ya lo envió.
    const clave = `recordatorio:${f.event_slug}`;
    const { data: claim } = await db
      .from("email_log")
      .upsert(
        { person_id: f.person_id, clave },
        { onConflict: "person_id,clave", ignoreDuplicates: true }
      )
      .select("id");
    if (!claim || claim.length === 0) {
      omitidos++;
      continue;
    }

    try {
      await enviarCorreo(
        f.people.email,
        plantillaRecordatorioEvento(f.people.email, {
          titulo: f.event_title,
          inicio: f.inicio,
          lugar: f.lugar ?? undefined,
          slug: f.event_slug,
        })
      );
      enviados++;
    } catch (err) {
      console.error(`[cron recordatorios] envío falló (${f.event_slug}):`, err);
    }
  }

  return NextResponse.json({ ok: true, enviados, omitidos, dia: manana });
}
