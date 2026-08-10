/**
 * Cron diario (7:00 CR): artículos automáticos por evento.
 *  - GUÍA previa para eventos futuros (próximos 45 días) sin artículo.
 *  - Esqueleto de COBERTURA para eventos terminados hace 12h–4 días.
 * Claude redacta en la voz de SeViveLa y el resultado queda como BORRADOR
 * en el Studio: nada se publica sin ojos humanos. Idempotente por _id
 * determinístico (un artículo por evento y tipo, aunque el cron repita).
 * Duerme sin SANITY_API_WRITE_TOKEN o sin ANTHROPIC_API_KEY.
 */
import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import {
  redaccionHabilitada,
  redactarArticulo,
  type ArticuloRedactado,
  type DatosEvento,
} from "@/lib/server/redaccion";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tope de artículos por corrida: acota costo y duración; el resto sale
 *  en las corridas siguientes (el cron es diario). */
const MAX_POR_CORRIDA = 2;

type EventoCrudo = DatosEvento & { _id: string; slug?: string };

let contadorKey = 0;
const key = () => `auto${(++contadorKey).toString(36)}${Date.now().toString(36)}`;

/** Secciones del artículo → Portable Text (bloques normal + h2). */
function aPortableText(articulo: ArticuloRedactado) {
  const bloques: Record<string, unknown>[] = [];
  for (const seccion of articulo.secciones) {
    if (seccion.subtitulo) {
      bloques.push({
        _type: "block",
        _key: key(),
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: key(), text: seccion.subtitulo, marks: [] }],
      });
    }
    for (const parrafo of seccion.parrafos) {
      if (!parrafo.trim()) continue;
      bloques.push({
        _type: "block",
        _key: key(),
        style: "normal",
        markDefs: [],
        children: [{ _type: "span", _key: key(), text: parrafo, marks: [] }],
      });
    }
  }
  return bloques;
}

function minutosLectura(articulo: ArticuloRedactado): number {
  const palabras = articulo.secciones
    .flatMap((s) => s.parrafos)
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
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
  const db = getWriteClient()!;

  const ahora = new Date();
  const en45d = new Date(ahora.getTime() + 45 * 86400000).toISOString();
  const hace12h = new Date(ahora.getTime() - 12 * 3600000).toISOString();
  const hace4d = new Date(ahora.getTime() - 4 * 86400000).toISOString();

  // Un viaje: candidatos futuros (guía) y recién pasados (cobertura).
  const { futuros, pasados } = await db.fetch<{
    futuros: EventoCrudo[];
    pasados: EventoCrudo[];
  }>(
    /* groq */ `{
      "futuros": *[_type == "evento" && !(_id in path("drafts.**")) && defined(slug.current) && defined(inicio) && inicio > $ahora && inicio < $en45d] | order(inicio asc)[0...20]{
        _id, title, vertical, inicio, fin, lugar, precioDesde, artista, organizador, descripcion, enlace, "slug": slug.current
      },
      "pasados": *[_type == "evento" && !(_id in path("drafts.**")) && defined(slug.current) && defined(inicio) && coalesce(fin, inicio) < $hace12h && coalesce(fin, inicio) > $hace4d] | order(inicio desc)[0...10]{
        _id, title, vertical, inicio, fin, lugar, precioDesde, artista, organizador, descripcion, enlace, "slug": slug.current
      }
    }`,
    { ahora: ahora.toISOString(), en45d, hace12h, hace4d }
  );

  // ¿Cuáles ya tienen su artículo (borrador O publicado)? El _id
  // determinístico hace el chequeo trivial y a prueba de repeticiones.
  const candidatos = [
    ...(futuros ?? []).map((e) => ({ e, tipo: "guia" as const })),
    ...(pasados ?? []).map((e) => ({ e, tipo: "cobertura" as const })),
  ].map((c) => ({
    ...c,
    idArticulo: `cronica-${c.tipo}-${c.e._id.replace(/[^a-zA-Z0-9-]/g, "")}`,
  }));
  const idsPosibles = candidatos.flatMap((c) => [
    c.idArticulo,
    `drafts.${c.idArticulo}`,
  ]);
  const existentes = new Set<string>(
    idsPosibles.length > 0
      ? await db.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, { ids: idsPosibles })
      : []
  );

  const pendientes = candidatos.filter(
    (c) => !existentes.has(c.idArticulo) && !existentes.has(`drafts.${c.idArticulo}`)
  );

  const creados: string[] = [];
  // Con el motivo del fallo: depurar desde el curl, sin abrir logs.
  const fallidos: { evento: string; motivo: string }[] = [];
  for (const { e, tipo, idArticulo } of pendientes.slice(0, MAX_POR_CORRIDA)) {
    try {
      const articulo = await redactarArticulo(tipo, e);
      if (!articulo) {
        fallidos.push({
          evento: e.title,
          motivo: "Claude declinó o la respuesta no tuvo la forma esperada.",
        });
        continue;
      }
      const slugBase = tipo === "guia" ? `guia-${e.slug}` : `asi-se-vivio-${e.slug}`;
      // createIfNotExists sobre drafts.<id>: nace como BORRADOR en el
      // Studio y jamás pisa un artículo que el equipo ya esté editando.
      await db.createIfNotExists({
        _id: `drafts.${idArticulo}`,
        _type: "cronica",
        title: articulo.titulo,
        slug: { _type: "slug", current: slugBase.slice(0, 96) },
        vertical: e.vertical,
        bajada: articulo.bajada,
        autor: "Redacción SeViveLa",
        formato: tipo === "guia" ? "Guía" : "Cobertura",
        lecturaMin: minutosLectura(articulo),
        cuerpo: aPortableText(articulo),
        fecha: new Date().toISOString(),
        esPortada: false,
        destacada: false,
      });
      creados.push(`${tipo}: ${articulo.titulo}`);
    } catch (err) {
      console.error(`[cron articulos] falló "${e.title}":`, err);
      fallidos.push({
        evento: e.title,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    candidatos: candidatos.length,
    yaExistian: candidatos.length - pendientes.length,
    creados,
    fallidos,
    pendientesProximaCorrida: Math.max(0, pendientes.length - MAX_POR_CORRIDA - fallidos.length),
  });
}
