/**
 * Cron diario (10:00 CR): posts de Instagram → eventos de la agenda.
 * El eslabón que cierra la cadena autónoma:
 *   post en @sevive.la → evento en la agenda (con el arte del post)
 *   → el cron de artículos le escribe su guía → el revisor la publica.
 * La IA extrae del caption SOLO lo que dice (fecha, lugar, precio; lo
 * incierto queda "hora por confirmar") y descarta duplicados contra la
 * agenda existente. Posts que no anuncian eventos se recuerdan en
 * app_config para no re-analizarlos (una llamada por post, una vez).
 * Duerme sin token de IG, sin SANITY_API_WRITE_TOKEN o sin ANTHROPIC_API_KEY.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { leerConfig, guardarConfig } from "@/lib/server/config-app";
import { redaccionHabilitada, extraerEventoDeIg } from "@/lib/server/redaccion";

export const runtime = "nodejs";
export const maxDuration = 300;

const GRAPH = "https://graph.instagram.com";
const CLAVE_TOKEN = "instagram_access_token";
const CLAVE_ANALIZADOS = "ig_posts_analizados";
/** Tope de posts analizados con IA por corrida (una llamada por post). */
const MAX_POR_CORRIDA = 5;

type MediaIG = {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
};

function slugDeTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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
  if (!redaccionHabilitada) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta ANTHROPIC_API_KEY en Vercel.",
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

  // 1. Últimos posts de la cuenta (todos los formatos: el flyer de un
  //    evento suele ser imagen o carrusel).
  const res = await fetch(
    `${GRAPH}/me/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,timestamp&limit=25&access_token=${encodeURIComponent(token)}`
  );
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error("[cron ig-eventos] Instagram respondió", res.status, detalle.slice(0, 300));
    return NextResponse.json(
      {
        ok: false,
        error:
          res.status === 400 || res.status === 401
            ? "El token de Instagram venció o no es válido (ver OPERACION.md)."
            : `Instagram respondió ${res.status}.`,
      },
      { status: 502 }
    );
  }
  const { data } = (await res.json()) as { data?: MediaIG[] };
  const posts = (data ?? []).filter((m) => (m.caption ?? "").trim().length >= 20);

  const db = getWriteClient()!;

  // 2. Qué posts ya se analizaron (memoria en Supabase) y qué eventos ya
  //    existen (para que la IA no duplique y para el choque de slugs).
  const analizados = new Set<string>(
    JSON.parse((await leerConfig(CLAVE_ANALIZADOS)) ?? "[]") as string[]
  );
  const idsEvento = posts.map((m) => `evento-ig-${m.id}`);
  const yaCreados = new Set<string>(
    idsEvento.length > 0
      ? await db.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, { ids: idsEvento })
      : []
  );
  const existentes = await db.fetch<
    { titulo: string; fecha: string; slug: string }[]
  >(
    /* groq */ `*[_type == "evento" && defined(inicio) && dateTime(inicio) > dateTime(now()) - 60*60*24*2] | order(inicio asc)[0...60]{
      "titulo": title, "fecha": inicio, "slug": slug.current
    }`
  );
  const slugsExistentes = new Set((existentes ?? []).map((e) => e.slug));

  const pendientes = posts.filter(
    (m) => !analizados.has(m.id) && !yaCreados.has(`evento-ig-${m.id}`)
  );

  const eventosCreados: string[] = [];
  const descartados: { post: string; motivo: string }[] = [];
  const fallidos: { post: string; motivo: string }[] = [];
  const hoyCR = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(new Date());

  for (const m of pendientes.slice(0, MAX_POR_CORRIDA)) {
    try {
      const extraido = await extraerEventoDeIg(
        m.caption ?? "",
        m.timestamp.slice(0, 10),
        (existentes ?? []).map((e) => ({ titulo: e.titulo, fecha: e.fecha.slice(0, 10) }))
      );
      analizados.add(m.id);
      if (!extraido || !extraido.esEventoNuevo || !extraido.fecha) {
        descartados.push({
          post: (m.caption ?? "").slice(0, 60),
          motivo: !extraido
            ? "La IA no devolvió un análisis válido."
            : !extraido.esEventoNuevo
              ? "No anuncia un evento nuevo (o ya está en la agenda)."
              : "Sin fecha determinable en el caption.",
        });
        continue;
      }
      if (extraido.fecha < hoyCR) {
        descartados.push({ post: extraido.titulo, motivo: "El evento ya pasó." });
        continue;
      }
      const slug = slugDeTitulo(extraido.titulo);
      if (!slug || slugsExistentes.has(slug)) {
        descartados.push({ post: extraido.titulo, motivo: "Slug vacío o ya existente." });
        continue;
      }

      // El arte del post = imagen del evento (asset propio, nunca CDN de IG).
      let imagen: Record<string, unknown> | undefined;
      const urlImagen = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
      if (urlImagen) {
        const img = await fetch(urlImagen);
        if (img.ok) {
          const buffer = Buffer.from(await img.arrayBuffer());
          const asset = await db.assets.upload("image", buffer, {
            filename: `evento-ig-${m.id}.jpg`,
          });
          imagen = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: extraido.titulo,
          };
        }
      }

      await db.createIfNotExists({
        _id: `evento-ig-${m.id}`,
        _type: "evento",
        title: extraido.titulo,
        slug: { _type: "slug", current: slug },
        vertical: extraido.vertical,
        inicio: `${extraido.fecha}T${extraido.hora ?? "12:00"}:00-06:00`,
        horaPorConfirmar: !extraido.hora,
        ...(extraido.lugar ? { lugar: extraido.lugar } : {}),
        ...(extraido.descripcion ? { descripcion: extraido.descripcion } : {}),
        ...(extraido.precioDesde ? { precioDesde: extraido.precioDesde } : {}),
        ...(imagen ? { imagen } : {}),
        enlace: m.permalink,
      });
      eventosCreados.push(`${extraido.titulo} (${extraido.fecha})`);
      slugsExistentes.add(slug);
    } catch (err) {
      fallidos.push({
        post: (m.caption ?? m.id).slice(0, 60),
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  // 3. Memoria de analizados (tope 300 ids) para no re-pagar la IA.
  await guardarConfig(
    CLAVE_ANALIZADOS,
    JSON.stringify([...analizados].slice(-300))
  );

  if (eventosCreados.length > 0) {
    revalidatePath("/");
    revalidatePath("/agenda");
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    postsNuevosAnalizados: Math.min(pendientes.length, MAX_POR_CORRIDA),
    eventosCreados,
    descartados,
    fallidos,
    pendientesProximaCorrida: Math.max(0, pendientes.length - MAX_POR_CORRIDA),
  });
}
