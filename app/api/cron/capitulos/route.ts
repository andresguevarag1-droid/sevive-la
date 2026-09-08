/**
 * Cron de capítulos (lunes y martes, 11:00 CR): los videos nuevos del
 * canal de YouTube de SeViveLa entran solos a /capitulos.
 * Lee el feed RSS PÚBLICO del canal (sin API keys ni cuotas), crea un
 * doc `capitulo` por video nuevo (_id determinístico: idempotente) y
 * refresca la página. El lunes sube el show de la semana; el martes es
 * la pasada de respaldo por si el video se subió tarde.
 * Duerme sin YOUTUBE_CHANNEL_ID o sin SANITY_API_WRITE_TOKEN.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!cronAutorizado(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!escrituraSanityHabilitada) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta SANITY_API_WRITE_TOKEN en Vercel.",
    });
  }
  const canal = process.env.YOUTUBE_CHANNEL_ID;
  if (!canal) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta YOUTUBE_CHANNEL_ID en Vercel (ver OPERACION.md).",
    });
  }

  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(canal)}`,
    { headers: { "User-Agent": "SeViveLa/1.0 (cron capitulos)" } }
  );
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `YouTube respondió ${res.status} (¿YOUTUBE_CHANNEL_ID correcto?).` },
      { status: 502 }
    );
  }
  const xml = await res.text();

  // Parseo liviano del feed Atom (sin dependencias): una entrada por video.
  const entradas = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    videoId: e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
    titulo: (e.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim(),
    publicado: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
  }));
  const videos = entradas.filter((v) => v.videoId && v.titulo);

  const db = getWriteClient()!;
  const ids = videos.map((v) => `capitulo-yt-${v.videoId}`);
  const existentes = new Set<string>(
    ids.length > 0
      ? await db.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, { ids })
      : []
  );

  const creados: string[] = [];
  const fallidos: { video: string; motivo: string }[] = [];
  for (const v of videos) {
    if (existentes.has(`capitulo-yt-${v.videoId}`)) continue;
    try {
      await db.createIfNotExists({
        _id: `capitulo-yt-${v.videoId}`,
        _type: "capitulo",
        titulo: v.titulo.slice(0, 140),
        youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
        fecha: v.publicado || new Date().toISOString(),
      });
      creados.push(v.titulo);
    } catch (err) {
      fallidos.push({
        video: v.titulo,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  if (creados.length > 0) {
    revalidatePath("/capitulos");
    revalidatePath("/");
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    videosEnElFeed: videos.length,
    creados,
    yaExistian: existentes.size,
    fallidos,
  });
}
