/**
 * Salud del sitio (O4): endpoint para el monitor de uptime.
 * Verifica Sanity (contenido) y Supabase (datos) con timeouts cortos y
 * responde 200 si el sitio puede servir; 503 si algo crítico falla.
 * Sin secretos ni PII en la respuesta.
 */
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function conTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

export async function GET() {
  const checks: Record<string, "ok" | "fallo" | "no_configurado"> = {};

  if (sanityConfigured) {
    try {
      await conTimeout(client.fetch(`count(*[_type == "evento"])`), 4000);
      checks.sanity = "ok";
    } catch {
      checks.sanity = "fallo";
    }
  } else {
    checks.sanity = "no_configurado";
  }

  const db = getServiceClient();
  if (db) {
    try {
      const { error } = await conTimeout(
        Promise.resolve(db.from("people").select("id", { count: "exact", head: true })),
        4000
      );
      checks.supabase = error ? "fallo" : "ok";
    } catch {
      checks.supabase = "fallo";
    }
  } else {
    checks.supabase = "no_configurado";
  }

  const critico = Object.values(checks).includes("fallo");
  return NextResponse.json(
    { ok: !critico, checks, ts: new Date().toISOString() },
    {
      status: critico ? 503 : 200,
      // 30 s de caché compartida: el monitor no amplifica carga a Sanity/Supabase.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=30" },
    }
  );
}
