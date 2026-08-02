/**
 * Baja del boletín (link firmado presente en cada correo — Ley 8968).
 * GET /api/baja?e=<email base64url>&t=<hmac>
 * Marca a la persona como 'unsubscribed' y actualiza la audiencia de Resend.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { verificarFirma, marcarBajaEnAudiencia } from "@/lib/server/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const irA = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl.origin), 303);

  const e = req.nextUrl.searchParams.get("e");
  const t = req.nextUrl.searchParams.get("t");
  if (!e || !t) return irA("/baja?error=1");

  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8").toLowerCase();
  } catch {
    return irA("/baja?error=1");
  }
  if (!verificarFirma(email, t)) return irA("/baja?error=1");

  const db = getServiceClient();
  if (!db) return irA("/baja?error=1");

  const { error } = await db
    .from("people")
    .update({ status: "unsubscribed" })
    .eq("email", email);
  if (error) {
    console.error("[baja] error dando de baja:", error);
    return irA("/baja?error=1");
  }

  try {
    await marcarBajaEnAudiencia(email);
  } catch (err) {
    console.error("[baja] audiencia Resend falló (no fatal):", err);
  }

  return irA("/baja");
}
