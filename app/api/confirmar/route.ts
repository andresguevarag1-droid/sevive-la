/**
 * Confirmación del doble opt-in del boletín (link firmado del correo).
 * GET /api/confirmar?e=<email base64url>&t=<hmac>
 * Verifica la firma, activa a la persona y la suma a la audiencia.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
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

  const e = req.nextUrl.searchParams.get("e");
  const t = req.nextUrl.searchParams.get("t");
  if (!e || !t) return irA("/confirmado?error=1");

  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8").toLowerCase();
  } catch {
    return irA("/confirmado?error=1");
  }
  if (!verificarFirma(email, t)) return irA("/confirmado?error=1");

  const db = getServiceClient();
  if (!db) return irA("/confirmado?error=1");

  const { error } = await db
    .from("people")
    .update({ status: "active" })
    .eq("email", email)
    .eq("status", "pending");
  if (error) {
    console.error("[confirmar] error activando:", error);
    return irA("/confirmado?error=1");
  }

  // Bienvenida + audiencia: no-fatal.
  if (emailEnabled) {
    try {
      await enviarCorreo(email, plantillaBienvenidaBoletin(email));
      await agregarAAudiencia(email);
    } catch (err) {
      console.error("[confirmar] correo/audiencia falló (no fatal):", err);
    }
  }

  return irA("/confirmado");
}
