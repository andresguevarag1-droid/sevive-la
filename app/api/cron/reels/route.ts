/**
 * Cron diario (9:00 CR): reels de Instagram → videoteca del sitio.
 * Regla de la casa: cron → DB → render (cero embeds oficiales en alto
 * tráfico). Trae los reels publicados en @sevive.la vía la API de
 * Instagram, crea el documento `reel` en Sanity (con miniatura subida
 * como asset propio) y publica DIRECTO: es contenido ya curado por el
 * equipo. La vertical se infiere de los hashtags del caption.
 *
 * Token: lee primero el renovado (app_config, migración 0011) y cae a
 * INSTAGRAM_ACCESS_TOKEN de Vercel. En cada corrida intenta renovarlo
 * (los tokens vencen a los 60 días) y guarda el nuevo.
 * Duerme sin token o sin SANITY_API_WRITE_TOKEN.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { leerConfig, guardarConfig } from "@/lib/server/config-app";
import type { VerticalSlug } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 300;

const GRAPH = "https://graph.instagram.com";
const CLAVE_TOKEN = "instagram_access_token";
/** Tope de reels nuevos por corrida (miniaturas se suben una a una). */
const MAX_POR_CORRIDA = 10;

type MediaIG = {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
};

/** Hashtags/palabras del caption → vertical del sitio. */
const PISTAS_VERTICAL: [VerticalSlug, string[]][] = [
  ["gastronomia", ["gastronomia", "gastronomía", "comida", "food", "foodie", "restaurante", "soda", "cafe", "café", "brunch", "chicharron"]],
  ["cultura", ["cultura", "arte", "museo", "teatro", "mural", "exposicion", "exposición"]],
  ["turismo", ["turismo", "viaje", "playa", "volcan", "volcán", "montaña", "naturaleza", "puravida"]],
  ["experiencias", ["experiencia", "experiencias", "aventura", "tour", "feria"]],
  ["estilo-de-vida", ["estilodevida", "lifestyle", "moda", "diseño", "bienestar"]],
  ["entretenimiento", ["entretenimiento", "concierto", "festival", "musica", "música", "fiesta", "show"]],
];

function inferirVertical(caption: string): VerticalSlug {
  const texto = caption
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  for (const [slug, pistas] of PISTAS_VERTICAL) {
    if (pistas.some((p) => texto.includes(p.normalize("NFD").replace(/[̀-ͯ]/g, "")))) {
      return slug;
    }
  }
  return "entretenimiento";
}

/** Primera línea del caption sin hashtags ni menciones → título editorial. */
function tituloDesdeCaption(caption?: string): string {
  const linea = (caption ?? "").split("\n")[0] ?? "";
  const limpio = linea
    .replace(/[#@][\p{L}\p{N}_.]+/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[·|•\-–—:,;]+$/g, "")
    .trim();
  return (limpio || "Reel de SeViveLa").slice(0, 110);
}

async function renovarToken(token: string): Promise<void> {
  try {
    const res = await fetch(
      `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
    );
    if (!res.ok) return; // tokens con <24h no se pueden renovar aún: normal
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (data.access_token) {
      await guardarConfig(CLAVE_TOKEN, data.access_token);
      if (data.expires_in) {
        const vence = new Date(Date.now() + data.expires_in * 1000).toISOString();
        await guardarConfig("instagram_token_vence", vence);
      }
    }
  } catch (err) {
    console.warn("[cron reels] renovación de token falló (no fatal):", err);
  }
}

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
  const token =
    (await leerConfig(CLAVE_TOKEN)) ||
    process.env.IG_ACCESS_TOKEN ||
    process.env.INSTAGRAM_ACCESS_TOKEN ||
    "";
  if (!token) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta IG_ACCESS_TOKEN en Vercel (ver OPERACION.md).",
    });
  }

  // 1. Últimos medios de la cuenta.
  const res = await fetch(
    `${GRAPH}/me/media?fields=id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp&limit=30&access_token=${encodeURIComponent(token)}`
  );
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error("[cron reels] Instagram respondió", res.status, detalle.slice(0, 300));
    return NextResponse.json(
      {
        ok: false,
        error:
          res.status === 400 || res.status === 401
            ? "El token de Instagram venció o no es válido: generá uno nuevo (ver OPERACION.md)."
            : `Instagram respondió ${res.status}.`,
      },
      { status: 502 }
    );
  }
  const { data } = (await res.json()) as { data?: MediaIG[] };
  const reels = (data ?? []).filter(
    (m) => m.media_product_type === "REELS" || m.media_type === "VIDEO"
  );

  const db = getWriteClient()!;
  const ids = reels.map((m) => `reel-ig-${m.id}`);
  const existentes = new Set<string>(
    ids.length > 0 ? await db.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, { ids }) : []
  );
  const nuevos = reels.filter((m) => !existentes.has(`reel-ig-${m.id}`));

  const creados: string[] = [];
  const fallidos: string[] = [];
  for (const m of nuevos.slice(0, MAX_POR_CORRIDA)) {
    try {
      // Miniatura como asset propio: el sitio nunca depende del CDN de IG.
      let miniatura: Record<string, unknown> | undefined;
      const urlMiniatura = m.thumbnail_url; // en videos, media_url es el mp4
      if (urlMiniatura) {
        const img = await fetch(urlMiniatura);
        if (img.ok) {
          const buffer = Buffer.from(await img.arrayBuffer());
          const asset = await db.assets.upload("image", buffer, {
            filename: `reel-ig-${m.id}.jpg`,
          });
          miniatura = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: tituloDesdeCaption(m.caption),
          };
        }
      }
      await db.createIfNotExists({
        _id: `reel-ig-${m.id}`,
        _type: "reel",
        title: tituloDesdeCaption(m.caption),
        vertical: inferirVertical(m.caption ?? ""),
        ...(miniatura ? { miniatura } : {}),
        videoUrl: m.permalink,
        fecha: m.timestamp,
      });
      creados.push(tituloDesdeCaption(m.caption));
    } catch (err) {
      console.error(`[cron reels] falló el reel ${m.id}:`, err);
      fallidos.push(m.id);
    }
  }

  // 2. Renovar el token para que nunca venza (guarda en app_config).
  await renovarToken(token);

  // 3. Contenido nuevo → refrescar las páginas que lo muestran.
  if (creados.length > 0) {
    revalidatePath("/");
    revalidatePath("/videos");
  }

  return NextResponse.json({
    ok: true,
    revisados: reels.length,
    yaExistian: existentes.size,
    creados,
    fallidos,
  });
}
