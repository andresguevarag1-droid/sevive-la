/**
 * Panel de administración · Tablero de datos de primera mano (D5).
 * Agrega SIN exponer PII: totales, serie diaria, fuentes (UTM), campañas,
 * segmentos por interés y redención de cupones. Protegido por ADMIN_PANEL_KEY.
 */
import { NextResponse } from "next/server";
import { adminConfigured, checkAdminKey } from "@/lib/server/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";

export const runtime = "nodejs";

type EntradaCruda = {
  created_at: string;
  campaign_slug: string;
  utm: { source?: string; medium?: string } | null;
  referred_by: string | null;
  eligible: boolean;
};

/** Día calendario YYYY-MM-DD en Costa Rica. */
function diaCR(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

export async function GET(req: Request) {
  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, estado: "no_configurado", error: "Falta ADMIN_PANEL_KEY en Vercel." },
      { status: 503 }
    );
  }
  // Rate-limit ANTES de evaluar la clave: los intentos fallidos también
  // consumen cuota (anti fuerza bruta).
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

  try {
    const [
      { data: entradas },
      { count: totalPersonas },
      { count: personasActivas },
      { count: pendientesConfirmar },
      { data: intereses },
      { data: statsCupones },
      { data: cuponesEstados },
      { data: interesEventos },
      { data: respaldos },
    ] = await Promise.all([
      db
        .from("campaign_entries")
        .select("created_at, campaign_slug, utm, referred_by, eligible")
        .order("created_at", { ascending: false })
        .limit(2000),
      db.from("people").select("id", { count: "exact", head: true }),
      db.from("people").select("id", { count: "exact", head: true }).eq("status", "active"),
      db.from("people").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("person_interests").select("vertical").limit(5000),
      db.from("coupon_stats").select("benefit_slug, emitidos, canjeados, tasa_redencion"),
      db.from("coupons").select("status").limit(5000),
      // Tablas nuevas: si la migración aún no corrió, data llega null y no rompe.
      db.from("event_interest").select("event_slug, event_title").limit(5000),
      db.from("saved_events").select("event_slug, event_title, person_id").limit(5000),
    ]);

    const lista = (entradas ?? []) as EntradaCruda[];

    // Serie diaria (últimos 14 días, incluyendo días en cero).
    const porDia: { dia: string; total: number }[] = [];
    const mapaDias = new Map<string, number>();
    for (const e of lista) {
      const d = diaCR(e.created_at);
      mapaDias.set(d, (mapaDias.get(d) ?? 0) + 1);
    }
    for (let i = 13; i >= 0; i--) {
      const d = diaCR(new Date(Date.now() - i * 86400000).toISOString());
      porDia.push({ dia: d, total: mapaDias.get(d) ?? 0 });
    }

    // Fuentes (utm.source del first-touch; "directo" si no hay).
    const fuentes = new Map<string, number>();
    for (const e of lista) {
      const f = (e.utm?.source || "directo").toLowerCase().slice(0, 40);
      fuentes.set(f, (fuentes.get(f) ?? 0) + 1);
    }

    // Campañas.
    const campanas = new Map<string, number>();
    for (const e of lista) {
      campanas.set(e.campaign_slug, (campanas.get(e.campaign_slug) ?? 0) + 1);
    }

    // Segmentos por vertical (intereses declarados/inferidos).
    const segmentos = new Map<string, number>();
    for (const i of (intereses ?? []) as { vertical: string }[]) {
      segmentos.set(i.vertical, (segmentos.get(i.vertical) ?? 0) + 1);
    }

    const cuponesPorEstado = new Map<string, number>();
    for (const c of (cuponesEstados ?? []) as { status: string }[]) {
      cuponesPorEstado.set(c.status, (cuponesPorEstado.get(c.status) ?? 0) + 1);
    }

    const aLista = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([clave, total]) => ({ clave, total }))
        .sort((a, b) => b.total - a.total);

    // Leads por evento: "avisame de la próxima" + guardados en agendas
    // respaldadas — lo que se le enseña al organizador para vender.
    const porEvento = new Map<string, { titulo: string; interesados: number; guardados: number }>();
    for (const i of (interesEventos ?? []) as { event_slug: string; event_title: string }[]) {
      const x = porEvento.get(i.event_slug) ?? { titulo: i.event_title, interesados: 0, guardados: 0 };
      x.interesados++;
      porEvento.set(i.event_slug, x);
    }
    for (const s of (respaldos ?? []) as { event_slug: string; event_title: string }[]) {
      const x = porEvento.get(s.event_slug) ?? { titulo: s.event_title, interesados: 0, guardados: 0 };
      x.guardados++;
      porEvento.set(s.event_slug, x);
    }
    const leadsPorEvento = [...porEvento.entries()]
      .map(([slug, x]) => ({ slug, ...x, total: x.interesados + x.guardados }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
    const personasConRespaldo = new Set(
      ((respaldos ?? []) as { person_id: string }[]).map((r) => r.person_id)
    ).size;

    return NextResponse.json({
      ok: true,
      participaciones: {
        total: lista.length,
        conReferido: lista.filter((e) => e.referred_by).length,
        elegibles: lista.filter((e) => e.eligible).length,
        porDia,
        porCampana: aLista(campanas),
        fuentes: aLista(fuentes).slice(0, 10),
      },
      personas: {
        total: totalPersonas ?? 0,
        activas: personasActivas ?? 0,
        porConfirmar: pendientesConfirmar ?? 0,
      },
      segmentos: aLista(segmentos),
      eventos: {
        leadsPorEvento,
        personasConRespaldo,
      },
      cupones: {
        porBeneficio: statsCupones ?? [],
        porEstado: aLista(cuponesPorEstado),
      },
    });
  } catch (err) {
    console.error("[admin] tablero falló:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar el tablero." },
      { status: 500 }
    );
  }
}
