/**
 * Confirmación del doble opt-in del boletín (link firmado del correo).
 * GET /api/confirmar?e=<email base64url>&t=<hmac>
 * Verifica la firma, activa a la persona y la suma a la audiencia.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";
import {
  verificarFirma,
  enviarCorreo,
  agregarAAudiencia,
  plantillaBienvenidaBoletin,
  emailEnabled,
} from "@/lib/server/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const irA = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl.origin), 303);

  const { allowed } = await checkRateLimit("confirmar", getClientIp(req));
  if (!allowed) return irA("/confirmado?error=1");

  const e = req.nextUrl.searchParams.get("e");
  const t = req.nextUrl.searchParams.get("t");
  const x = req.nextUrl.searchParams.get("x");
  if (!e || !t) return irA("/confirmado?error=1");

  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8").toLowerCase();
  } catch {
    return irA("/confirmado?error=1");
  }
  if (!verificarFirma(email, t, "confirmar", x)) return irA("/confirmado?error=1");

  const db = getServiceClient();
  if (!db) return irA("/confirmado?error=1");

  const { data: activadas, error } = await db
    .from("people")
    .update({ status: "active" })
    .eq("email", email)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.error("[confirmar] error activando:", error);
    return irA("/confirmado?error=1");
  }

  // Si no había nada 'pending' (re-click, persona
  // ya activa o dada de baja), NO se reenvía nada ni se toca la audiencia.
  const activada = (activadas?.length ?? 0) > 0;

  // Bienvenida + audiencia: no-fatal, solo en la activación real.
  if (activada && emailEnabled) {
    try {
      await enviarCorreo(email, plantillaBienvenidaBoletin(email));
      await agregarAAudiencia(email);
    } catch (err) {
      console.error("[confirmar] correo/audiencia falló (no fatal):", err);
    }
  }

  return irA("/confirmado");
}
