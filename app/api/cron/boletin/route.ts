/**
 * Cron semanal (jueves 8:00 CR): el boletín "Los planes de esta semana",
 * armado solo desde Sanity (eventos próximos + crónicas recientes + un
 * beneficio) y enviado a quienes consintieron el boletín y están activos.
 * Idempotente vía email_log (claim `boletin:<fecha>`). Dormido sin Resend.
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { getEventosProximos, getBeneficiosTodos } from "@/lib/sanity/listados";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import {
  emailEnabled,
  enviarCorreo,
  plantillaBoletinSemanal,
  type BoletinContenido,
} from "@/lib/server/email";

export const runtime = "nodejs";
export const maxDuration = 300;

import { createHash, timingSafeEqual } from "node:crypto";

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recibido = req.headers.get("authorization") ?? "";
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}

function diaCR(t: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(
    new Date(t)
  );
}

async function armarContenido(): Promise<BoletinContenido> {
  const [eventos, beneficios] = await Promise.all([
    getEventosProximos(),
    getBeneficiosTodos(),
  ]);
  const semana = Date.now() + 8 * 86400000;
  const deLaSemana = eventos
    .filter((e) => e.href && e.inicio && new Date(e.inicio).getTime() <= semana)
    .slice(0, 8)
    .map((e) => ({
      titulo: e.title,
      inicio: e.inicio,
      lugar: e.lugarNombre,
      slug: e.href!.split("/")[2] ?? "",
      // Sin hora oficial (e.hora undefined), el correo muestra solo el día.
      horaPorConfirmar: !e.hora,
    }))
    .filter((e) => e.slug);

  let cronicas: { titulo: string; slug: string }[] = [];
  if (sanityConfigured) {
    try {
      const raw = await client.fetch<{ title: string; slug: string }[]>(
        /* groq */ `*[_type == "cronica" && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...3]{ title, "slug": slug.current }`
      );
      cronicas = (raw ?? [])
        .filter((c) => c.slug)
        .map((c) => ({ titulo: c.title, slug: c.slug }));
    } catch (err) {
      console.error("[cron boletin] crónicas fallaron (no fatal):", err);
    }
  }

  const b = beneficios.find((x) => x.href);
  return {
    eventos: deLaSemana,
    cronicas,
    beneficio: b
      ? { titulo: b.title, marca: b.author ?? "SeViveLa", slug: b.href!.split("/")[2] ?? "" }
      : undefined,
  };
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!emailEnabled) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "resend_no_configurado" });
  }
  const db = getServiceClient();
  if (!db) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "supabase_no_configurado" });
  }

  const contenido = await armarContenido();
  if (contenido.eventos.length === 0 && contenido.cronicas.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "sin_contenido" });
  }

  // Audiencia: consentimiento de boletín + persona activa, sin duplicados.
  const { data: consintieron, error } = await db
    .from("consents")
    .select("person_id, people(id, email, status)")
    .eq("purpose", "newsletter")
    .eq("granted", true)
    .limit(5000);
  if (error) {
    console.error("[cron boletin] audiencia falló:", error);
    return NextResponse.json({ ok: false, error: "Consulta falló." }, { status: 500 });
  }

  const clave = `boletin:${diaCR(Date.now())}`;
  const vistos = new Set<string>();
  let enviados = 0;
  let omitidos = 0;

  for (const c of (consintieron ?? []) as unknown as {
    person_id: string;
    people: { id: string; email: string; status: string } | null;
  }[]) {
    const p = c.people;
    if (!p?.email || p.status !== "active" || vistos.has(p.email)) continue;
    vistos.add(p.email);

    const { data: claim } = await db
      .from("email_log")
      .upsert(
        { person_id: c.person_id, clave },
        { onConflict: "person_id,clave", ignoreDuplicates: true }
      )
      .select("id");
    if (!claim || claim.length === 0) {
      omitidos++;
      continue;
    }

    try {
      await enviarCorreo(p.email, plantillaBoletinSemanal(p.email, contenido));
      enviados++;
    } catch (err) {
      console.error(`[cron boletin] envío falló:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    enviados,
    omitidos,
    edicion: clave,
    eventos: contenido.eventos.length,
  });
}
