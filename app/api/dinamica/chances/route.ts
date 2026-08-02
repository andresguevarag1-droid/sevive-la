/**
 * Contador en vivo de referidos: GET /api/dinamica/chances?slug=<campaña>&code=<referral_code>
 * Devuelve { referrals, chances } (1 base + referidos válidos, con el tope
 * configurado en la campaña). Sin PII. Rate-limited y cacheable unos segundos.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getCampana } from "@/lib/sanity/campana";
import { getClientIp } from "@/lib/server/request-meta";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  const code = (req.nextUrl.searchParams.get("code") ?? "").toUpperCase();
  if (!/^[a-z0-9-]{1,96}$/.test(slug) || !/^[A-Z0-9]{4,12}$/.test(code)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { allowed } = await checkRateLimit("chances", getClientIp(req));
  if (!allowed) return NextResponse.json({ ok: false }, { status: 429 });

  const db = getServiceClient();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  // Dueño del código (para excluir auto-referidos) + tope de la campaña.
  const [{ data: dueno }, campana] = await Promise.all([
    db
      .from("campaign_entries")
      .select("email")
      .eq("campaign_slug", slug)
      .eq("referral_code", code)
      .maybeSingle(),
    getCampana(slug),
  ]);
  if (!dueno) return NextResponse.json({ ok: false }, { status: 404 });

  const { count } = await db
    .from("campaign_entries")
    .select("id", { count: "exact", head: true })
    .eq("campaign_slug", slug)
    .eq("referred_by", code)
    .eq("referral_valid", true)
    .neq("email", dueno.email);

  const referrals = count ?? 0;
  const tope = campana?.chancesMaxPorReferido ?? 10;
  const chances = 1 + Math.min(referrals, tope);

  return NextResponse.json(
    { ok: true, referrals, chances },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
  );
}
