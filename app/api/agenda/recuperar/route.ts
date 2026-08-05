/**
 * Recuperar "Mi agenda" en otro dispositivo: envía un link mágico firmado
 * al correo con el que se respaldó. Respuesta SIEMPRE genérica (no revela
 * si un correo existe o no). Dormido sin Resend: responde 503 amable.
 */
import { NextResponse } from "next/server";
import { recuperarAgendaSchema } from "@/lib/validation/agenda";
import { getServiceClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { verifyTurnstile } from "@/lib/server/turnstile";
import {
  emailEnabled,
  enviarCorreo,
  plantillaRecuperarAgenda,
} from "@/lib/server/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    (body as { website?: unknown }).website
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = recuperarAgendaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit("agenda-recuperar", ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const humano = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!humano) {
    return NextResponse.json(
      { ok: false, error: "No pudimos verificar que sos una persona. Recargá e intentá de nuevo." },
      { status: 403 }
    );
  }

  if (!emailEnabled) {
    return NextResponse.json(
      { ok: false, error: "La recuperación por correo estará disponible muy pronto." },
      { status: 503 }
    );
  }

  const db = getServiceClient();
  if (db) {
    try {
      const { data: persona } = await db
        .from("people")
        .select("id")
        .eq("email", parsed.data.email)
        .maybeSingle();
      if (persona) {
        const { count } = await db
          .from("saved_events")
          .select("id", { count: "exact", head: true })
          .eq("person_id", persona.id);
        if (count && count > 0) {
          const plantilla = plantillaRecuperarAgenda(parsed.data.email, count);
          if (plantilla) await enviarCorreo(parsed.data.email, plantilla);
        }
      }
    } catch (err) {
      // No filtrar el error al cliente: la respuesta sigue siendo genérica.
      console.error("[agenda] recuperar falló:", err);
    }
  }

  // Genérico a propósito: no confirma ni niega que el correo exista.
  return NextResponse.json({ ok: true });
}
