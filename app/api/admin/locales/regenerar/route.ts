/**
 * Panel de administración · Regenerar el PIN de un local.
 * El PIN anterior deja de servir al instante (se pisa el token_hash).
 */
import { NextResponse } from "next/server";
import { adminConfigured, checkAdminKey, generarPinLocal } from "@/lib/server/admin";
import { regenerarPinSchema } from "@/lib/validation/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { hashVenueToken } from "@/lib/server/coupon";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";
import { enviarPinPorCorreo } from "@/lib/server/venue-pin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, estado: "no_configurado", error: "Falta ADMIN_PANEL_KEY en Vercel." },
      { status: 503 }
    );
  }
  // Rate-limit ANTES de evaluar la clave (anti fuerza bruta).
  const { allowed } = await checkRateLimit("admin", getClientIp(req));
  if (!allowed) return NextResponse.json({ ok: false, estado: "rate_limited" }, { status: 429 });
  if (!checkAdminKey(req)) {
    return NextResponse.json({ ok: false, estado: "clave_incorrecta" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const parsed = regenerarPinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, estado: "sin_supabase", error: "Supabase no está configurado." },
      { status: 503 }
    );
  }

  try {
    const { data: venue } = await db
      .from("venues")
      .select("slug, name, benefit_slugs")
      .eq("slug", d.slug)
      .maybeSingle();
    if (!venue) {
      return NextResponse.json({ ok: false, error: "Ese local no existe." }, { status: 404 });
    }

    const pin = generarPinLocal(venue.name as string);
    const { error } = await db
      .from("venues")
      .update({ token_hash: hashVenueToken(pin) })
      .eq("slug", d.slug);
    if (error) throw error;

    const correo = await enviarPinPorCorreo(
      d.email,
      venue.name as string,
      pin,
      (venue.benefit_slugs as string[] | null) ?? []
    );

    return NextResponse.json({ ok: true, slug: venue.slug, pin, ...correo });
  } catch (err) {
    console.error("[admin] error regenerando PIN:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo regenerar el PIN. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
