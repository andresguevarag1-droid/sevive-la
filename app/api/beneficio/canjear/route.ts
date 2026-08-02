/**
 * Canje de cupón por el LOCAL (Feature B). Exige token de local (hasheado
 * contra venues.token_hash). Un solo uso, atómico: update condicionado a
 * status='issued' — el doble tap no puede canjear dos veces.
 */
import { NextResponse } from "next/server";
import { canjearSchema } from "@/lib/validation/beneficio";
import { getServiceClient } from "@/lib/supabase/server";
import { hashVenueToken } from "@/lib/server/coupon";
import { getClientIp } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, estado: "no_valido" }, { status: 400 });
  }

  const parsed = canjearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, estado: "no_valido", error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }
  const { code, venueToken } = parsed.data;

  const { allowed } = await checkRateLimit("canje", getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ ok: false, estado: "rate_limited" }, { status: 429 });
  }

  const db = getServiceClient();
  if (!db) return NextResponse.json({ ok: false, estado: "error" }, { status: 503 });

  // Autenticación del local por hash del token.
  const { data: venue } = await db
    .from("venues")
    .select("slug, name, benefit_slugs")
    .eq("token_hash", hashVenueToken(venueToken))
    .maybeSingle();
  if (!venue) {
    return NextResponse.json({ ok: false, estado: "local_no_autorizado" }, { status: 401 });
  }
  const alcance = (venue.benefit_slugs as string[] | null) ?? null;

  // Canje atómico: solo si sigue 'issued', no expiró y el beneficio es de
  // este local (un local no puede quemar cupones de otra marca).
  const ahora = new Date().toISOString();
  let canje = db
    .from("coupons")
    .update({ status: "redeemed", redeemed_at: ahora, redeemed_by: venue.slug })
    .eq("code", code)
    .eq("status", "issued")
    .or(`expires_at.is.null,expires_at.gt.${ahora}`);
  if (alcance && alcance.length > 0) {
    canje = canje.in("benefit_slug", alcance);
  }
  const { data: canjeadas, error } = await canje.select("code, benefit_slug");
  if (error) {
    console.error("[canje] error:", error);
    return NextResponse.json({ ok: false, estado: "error" }, { status: 500 });
  }

  if (canjeadas && canjeadas.length > 0) {
    return NextResponse.json({
      ok: true,
      estado: "canjeado",
      benefitSlug: canjeadas[0].benefit_slug,
      venue: venue.name,
    });
  }

  // No se canjeó: distinguir el porqué.
  const { data: cupon } = await db
    .from("coupons")
    .select("status, redeemed_at, expires_at, benefit_slug")
    .eq("code", code)
    .maybeSingle();
  if (!cupon) return NextResponse.json({ ok: false, estado: "no_valido" });
  if (
    cupon.status === "issued" &&
    alcance &&
    alcance.length > 0 &&
    !alcance.includes(cupon.benefit_slug as string)
  ) {
    // Cupón válido pero de otra marca: no se quema y se avisa claro.
    return NextResponse.json({ ok: false, estado: "otro_local" });
  }
  if (cupon.status === "redeemed") {
    return NextResponse.json({
      ok: false,
      estado: "ya_canjeado",
      redeemedAt: cupon.redeemed_at,
    });
  }
  if (
    cupon.status === "expired" ||
    (cupon.expires_at && new Date(cupon.expires_at as string) <= new Date())
  ) {
    return NextResponse.json({ ok: false, estado: "vencido" });
  }
  return NextResponse.json({ ok: false, estado: "no_valido" });
}
