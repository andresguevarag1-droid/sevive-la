/**
 * Buzón manual de posts (POST): la alternativa mientras no hay token de
 * Instagram. El equipo pega el caption (y opcionalmente la URL de la
 * imagen y el link del post) en /admin/publicar y la MISMA IA del cron
 * ig-eventos extrae el evento y lo crea en la agenda — de ahí en
 * adelante todo sigue solo (anuncio 6:40, guía cerca de la fecha,
 * corrección y publicación 7:15).
 * Acepta la clave del panel (x-admin-key) o el Bearer CRON_SECRET.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cronAutorizado } from "@/lib/server/cron-auth";
import { checkAdminKey, adminConfigured } from "@/lib/server/admin";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { redaccionHabilitada, extraerEventoDeIg } from "@/lib/server/redaccion";

export const runtime = "nodejs";
export const maxDuration = 120;

const cuerpoSchema = z.object({
  caption: z.string().trim().min(20, "Pegá el texto completo del post.").max(5000),
  imagenUrl: z.string().trim().url().startsWith("https://").optional().or(z.literal("")),
  enlace: z.string().trim().url().startsWith("https://").optional().or(z.literal("")),
});

function slugDeTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function POST(req: Request) {
  const autorizado = cronAutorizado(req) || (adminConfigured && checkAdminKey(req));
  if (!autorizado) {
    return NextResponse.json({ ok: false, error: "Clave incorrecta." }, { status: 401 });
  }
  if (!escrituraSanityHabilitada || !redaccionHabilitada) {
    return NextResponse.json(
      { ok: false, error: "Faltan llaves en Vercel (Sanity/Anthropic)." },
      { status: 503 }
    );
  }
  const parsed = cuerpoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const { caption, imagenUrl, enlace } = parsed.data;
  const db = getWriteClient()!;

  const existentes = await db.fetch<{ titulo: string; fecha: string; slug: string }[]>(
    /* groq */ `*[_type == "evento" && defined(inicio) && dateTime(inicio) > dateTime(now()) - 60*60*24*2] | order(inicio asc)[0...60]{
      "titulo": title, "fecha": inicio, "slug": slug.current
    }`
  );

  const hoyCR = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
  }).format(new Date());
  const extraido = await extraerEventoDeIg(
    caption,
    hoyCR,
    (existentes ?? []).map((e) => ({ titulo: e.titulo, fecha: e.fecha.slice(0, 10) }))
  );

  if (!extraido) {
    return NextResponse.json({
      ok: true,
      creado: false,
      motivo: "La IA no pudo analizar el texto. Probá pegando el caption completo.",
    });
  }
  if (!extraido.esEventoNuevo) {
    return NextResponse.json({
      ok: true,
      creado: false,
      motivo: "El texto no anuncia un evento nuevo (o ya está en la agenda).",
    });
  }
  if (!extraido.fecha) {
    return NextResponse.json({
      ok: true,
      creado: false,
      motivo: "No se pudo determinar la fecha con certeza: agregala al texto y reintentá.",
    });
  }
  if (extraido.fecha < hoyCR) {
    return NextResponse.json({ ok: true, creado: false, motivo: "Ese evento ya pasó." });
  }
  const slug = slugDeTitulo(extraido.titulo);
  const slugsExistentes = new Set((existentes ?? []).map((e) => e.slug));
  if (!slug || slugsExistentes.has(slug)) {
    return NextResponse.json({
      ok: true,
      creado: false,
      motivo: "Ya existe un evento con ese nombre en la agenda.",
    });
  }

  // Imagen opcional: se sube como asset propio (nunca se depende del CDN ajeno).
  let imagen: Record<string, unknown> | undefined;
  if (imagenUrl) {
    try {
      const img = await fetch(imagenUrl);
      const tipo = img.headers.get("content-type") ?? "";
      if (img.ok && tipo.startsWith("image/")) {
        const buffer = Buffer.from(await img.arrayBuffer());
        if (buffer.byteLength <= 8 * 1024 * 1024) {
          const asset = await db.assets.upload("image", buffer, {
            filename: `evento-manual-${slug}.jpg`,
          });
          imagen = {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
            alt: extraido.titulo,
          };
        }
      }
    } catch {
      /* sin imagen: el evento igual sale (con tarjeta generada) */
    }
  }

  await db.createIfNotExists({
    _id: `evento-manual-${slug}`,
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
    ...(enlace ? { enlace } : {}),
  });
  revalidatePath("/");
  revalidatePath("/agenda");

  return NextResponse.json({
    ok: true,
    creado: true,
    evento: {
      titulo: extraido.titulo,
      fecha: extraido.fecha,
      hora: extraido.hora ?? "por confirmar",
      lugar: extraido.lugar ?? "—",
      url: `/agenda/${slug}`,
    },
  });
}
