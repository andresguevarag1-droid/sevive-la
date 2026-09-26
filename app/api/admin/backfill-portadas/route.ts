/**
 * Arreglo retroactivo, UNA SOLA VEZ (a mano, con curl):
 *   curl -H "Authorization: Bearer $CRON_SECRET" .../api/admin/backfill-portadas
 *
 * Las crónicas del redactor de planta (notas de anuncio y roundups) que
 * salieron publicadas ANTES de que el cron generara su propia portada de
 * marca se quedaron con el recuadro gris vacío en tarjetas/carrusel. Este
 * endpoint les pone la portada de marca ahora, sin tocar lo escrito a mano
 * por el equipo (solo toca autor == "Redacción SeViveLa").
 */
import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/server/cron-auth";
import { checkAdminKey, adminConfigured } from "@/lib/server/admin";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { portadaGenerada } from "@/lib/server/portada-generada";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_POR_CORRIDA = 10;

type CronicaSinFoto = { _id: string; title: string; vertical: string };

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

  const sinFoto = await db.fetch<CronicaSinFoto[]>(
    /* groq */ `*[_type == "cronica" && !(_id in path("drafts.**")) && autor == "Redacción SeViveLa" && !defined(imagen)][0...${MAX_POR_CORRIDA}]{ _id, title, vertical }`
  );

  const arregladas: string[] = [];
  const fallidas: { titulo: string; motivo: string }[] = [];
  for (const c of sinFoto ?? []) {
    try {
      const buffer = await portadaGenerada(c.title, c.vertical);
      const asset = await db.assets.upload("image", buffer, {
        filename: `portada-${c._id}.png`,
      });
      await db.patch(c._id).set({
        imagen: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
      }).commit();
      arregladas.push(c.title);
    } catch (err) {
      fallidas.push({
        titulo: c.title,
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
