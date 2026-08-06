/**
 * Baja del boletín (link firmado presente en cada correo — Ley 8968).
 *
 * GET  /api/baja?e=…&t=…&x=…  → redirige a la página de confirmación
 *      (los escáneres de links corporativos y los prefetch ya no dan de
 *      baja a nadie por visitar la URL).
 * POST /api/baja              → ejecuta la baja. Lo usan el botón de la
 *      página de confirmación y el One-Click de Gmail/Yahoo
 *      (List-Unsubscribe-Post).
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { verificarFirma, marcarBajaEnAudiencia } from "@/lib/server/email";
import { getClientIp } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

function decodificar(e: string | null): string | null {
  if (!e) return null;
  try {
    return Buffer.from(e, "base64url").toString("utf8").toLowerCase();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const irA = (path: string) =>
    NextResponse.redirect(new URL(path, req.nextUrl.origin), 303);

  // Sin rate-limit en el GET: no muta nada (solo valida y redirige) y un
  // escáner de links corporativo en ráfaga bloqueaba al usuario legítimo.
  const e = req.nextUrl.searchParams.get("e");
  const t = req.nextUrl.searchParams.get("t");
  const x = req.nextUrl.searchParams.get("x");
  const email = decodificar(e);
  if (!email || !t || !verificarFirma(email, t, "baja", x)) {
    return irA("/baja?error=1");
  }

  // Confirmación explícita: un clic humano más, cero bajas fantasma.
  const destino = new URL("/baja/confirmar", req.nextUrl.origin);
  destino.searchParams.set("e", e!);
  destino.searchParams.set("t", t);
  if (x) destino.searchParams.set("x", x);
  return NextResponse.redirect(destino, 303);
}

export async function POST(req: NextRequest) {
  // One-Click (RFC 8058): Gmail/Yahoo mandan los parámetros por query y
  // esperan un 2xx, no un redirect. El formulario de la página manda los
  // campos en el body y sí espera el 303 a /baja.
  const oneClick = Boolean(
    req.nextUrl.searchParams.get("e") && req.nextUrl.searchParams.get("t")
  );
  const responder = (ok: boolean) =>
    oneClick
      ? NextResponse.json({ ok }, { status: ok ? 200 : 400 })
      : NextResponse.redirect(
          new URL(ok ? "/baja" : "/baja?error=1", req.nextUrl.origin),
          303
        );

  const { allowed } = await checkRateLimit("baja", getClientIp(req));
  if (!allowed) return responder(false);

  // Acepta los parámetros por query (One-Click) o por formulario (página).
  let e = req.nextUrl.searchParams.get("e");
  let t = req.nextUrl.searchParams.get("t");
  let x = req.nextUrl.searchParams.get("x");
  if (!e || !t) {
    try {
      const form = await req.formData();
      e = e ?? (form.get("e") as string | null);
      t = t ?? (form.get("t") as string | null);
      x = x ?? (form.get("x") as string | null);
    } catch {
      /* sin body de formulario */
    }
  }

  const email = decodificar(e);
  if (!email || !t || !verificarFirma(email, t, "baja", x)) {
    return responder(false);
  }

  const db = getServiceClient();
  if (!db) return responder(false);

  const { error } = await db
    .from("people")
    .update({ status: "unsubscribed" })
    .eq("email", email);
  if (error) {
    console.error("[baja] error dando de baja:", error);
    return responder(false);
  }

  try {
    await marcarBajaEnAudiencia(email);
  } catch (err) {
    console.error("[baja] audiencia Resend falló (no fatal):", err);
  }

  return responder(true);
}
