/**
 * Panel de administración · Participantes de una campaña (para hacer el
 * sorteo). A diferencia de /api/admin/datos (agregados, sin PII), este
 * endpoint SÍ devuelve datos personales de los participantes — protegido
 * por la misma ADMIN_PANEL_KEY, herramienta interna del dueño.
 *
 * GET /api/admin/participantes            → lista de campañas con conteo
 * GET /api/admin/participantes?campana=x  → participantes de esa campaña
 */
import { NextResponse, type NextRequest } from "next/server";
import { adminConfigured, checkAdminKey } from "@/lib/server/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";

export const runtime = "nodejs";

type Entrada = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  residence: string;
  is_over_21: boolean;
  has_passport: boolean;
  has_us_visa: boolean;
  eligible: boolean;
  follows_ig: boolean;
  edad: number | null;
  interes_respuesta: string | null;
  referral_code: string | null;
  referred_by: string | null;
  referral_valid: boolean;
};

export async function GET(req: NextRequest) {
  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, estado: "no_configurado", error: "Falta ADMIN_PANEL_KEY en Vercel." },
      { status: 503 }
    );
  }
  const { allowed } = await checkRateLimit("admin", getClientIp(req));
  if (!allowed) return NextResponse.json({ ok: false, estado: "rate_limited" }, { status: 429 });
  if (!checkAdminKey(req)) {
    return NextResponse.json({ ok: false, estado: "clave_incorrecta" }, { status: 401 });
  }

  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, estado: "sin_supabase", error: "Supabase no está configurado." },
      { status: 503 }
    );
  }

  const slug = req.nextUrl.searchParams.get("campana");

  // Sin campaña elegida: la lista de campañas con conteo, para el selector.
  if (!slug) {
    const { data, error } = await db
      .from("campaign_entries")
      .select("campaign_slug")
      .limit(20000);
    if (error) {
      console.error("[admin] participantes (lista de campañas) falló:", error);
      return NextResponse.json({ ok: false, error: "No se pudo cargar." }, { status: 500 });
    }
    const conteo = new Map<string, number>();
    for (const { campaign_slug } of (data ?? []) as { campaign_slug: string }[]) {
      conteo.set(campaign_slug, (conteo.get(campaign_slug) ?? 0) + 1);
    }
    const campanas = [...conteo.entries()]
      .map(([slug, total]) => ({ slug, total }))
      .sort((a, b) => b.total - a.total);
    return NextResponse.json({ ok: true, campanas });
  }

  if (!/^[a-z0-9-]{1,96}$/.test(slug)) {
    return NextResponse.json({ ok: false, error: "Campaña inválida." }, { status: 400 });
  }

  const [{ data: entradas, error: errEntradas }, { data: chances, error: errChances }] =
    await Promise.all([
      db
        .from("campaign_entries")
        .select(
          "id, created_at, full_name, email, phone, residence, is_over_21, has_passport, has_us_visa, eligible, follows_ig, edad, interes_respuesta, referral_code, referred_by, referral_valid"
        )
        .eq("campaign_slug", slug)
        .order("created_at", { ascending: true })
        .limit(5000),
      db.from("entry_chances").select("email, chances").eq("campaign_slug", slug).limit(5000),
    ]);

  if (errEntradas) {
    console.error("[admin] participantes falló:", errEntradas);
    return NextResponse.json({ ok: false, error: "No se pudo cargar." }, { status: 500 });
  }
  if (errChances) {
    // La vista de chances es un plus (referidos); si falla, seguimos sin ella.
    console.error("[admin] entry_chances falló:", errChances);
  }

  const chancesPorEmail = new Map<string, number>(
    ((chances ?? []) as { email: string; chances: number }[]).map((c) => [c.email, c.chances])
  );

  const lista = ((entradas ?? []) as Entrada[]).map((e) => ({
    ...e,
    chances: chancesPorEmail.get(e.email) ?? 1,
  }));

  return NextResponse.json({ ok: true, campana: slug, total: lista.length, entradas: lista });
}
