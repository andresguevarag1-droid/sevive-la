/**
 * Arreglo retroactivo (a mano, con curl, o repetible las veces que haga
 * falta — es idempotente, nunca pisa una foto real):
 *   curl -H "Authorization: Bearer $CRON_SECRET" .../api/admin/backfill-portadas
 *
 * Les pone la portada de marca a TODAS las crónicas y eventos publicados
 * que todavía no tienen `imagen` — sin importar quién los escribió. Es el
 * parche "mientras no haya fotos reales": en cuanto el equipo suba una foto
 * de verdad en el Studio (o llegue el banco de fotos), esa pisa a la
 * generada sin que haga falta tocar nada acá.
 */
import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/server/cron-auth";
import { checkAdminKey, adminConfigured } from "@/lib/server/admin";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { subirPortadaGenerada } from "@/lib/server/portada-generada";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_POR_CORRIDA = 24;

type DocSinFoto = { _id: string; _type: "cronica" | "evento"; title: string; vertical: string };

export async function GET(req: Request) {
  const { allowed } = await checkRateLimit("admin", getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos." }, { status: 429 });
  }
  const autorizado = cronAutorizado(req) || (adminConfigured && checkAdminKey(req));
  if (!autorizado) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!escrituraSanityHabilitada) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta SANITY_API_WRITE_TOKEN en Vercel.",
    });
  }
  const db = getWriteClient()!;

  const sinFoto = await db.fetch<DocSinFoto[]>(
    /* groq */ `*[
      (_type == "cronica" || _type == "evento") &&
      !(_id in path("drafts.**")) &&
      defined(vertical) &&
      !defined(imagen)
    ][0...${MAX_POR_CORRIDA}]{ _id, _type, title, vertical }`
  );

  const arregladas: string[] = [];
  const fallidas: { titulo: string; motivo: string }[] = [];
  for (const d of sinFoto ?? []) {
    try {
      const imagen = await subirPortadaGenerada(db, d.title, d.vertical, d._id);
      if (!imagen) {
        fallidas.push({ titulo: d.title, motivo: "La generación de la portada falló." });
        continue;
      }
      await db.patch(d._id).set({ imagen }).commit();
      arregladas.push(`${d._type === "evento" ? "evento" : "crónica"}: ${d.title}`);
    } catch (err) {
      fallidas.push({
        titulo: d.title,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    ok: fallidas.length === 0,
    revisadas: sinFoto?.length ?? 0,
    arregladas,
    fallidas,
    nota:
      sinFoto && sinFoto.length === MAX_POR_CORRIDA
        ? "Puede que queden más — volvé a correr el mismo curl."
        : undefined,
  });
}
