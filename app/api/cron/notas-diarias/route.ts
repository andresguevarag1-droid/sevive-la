/**
 * Cron diario (6:40 CR): el "redactor de planta" — notas que salen
 * COMPLETAS solo con los datos de la agenda (sin [COMPLETAR], sin manos):
 *  - ANUNCIOS: cada evento nuevo de la agenda (últimas 26 h) recibe su
 *    nota "se confirmó este plan" (máx. 2 por día).
 *  - Lunes: "La semana en planes" — roundup de los próximos 7 días.
 *  - Jueves: "Los planes del finde" — viernes a domingo.
 * Nacen como borrador con autor de la redacción automática y 35 minutos
 * después el revisor (7:15) los corrige y PUBLICA: contenido fresco a
 * diario sin tocar nada. Duerme sin SANITY_API_WRITE_TOKEN o ANTHROPIC_API_KEY.
 */
import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import {
  redaccionHabilitada,
  redactarNotaDeAgenda,
  type DatosEvento,
} from "@/lib/server/redaccion";
import { aPortableText, minutosLectura } from "@/lib/server/articulo-pt";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_ANUNCIOS_POR_CORRIDA = 2;

type EventoCrudo = DatosEvento & { _id: string; slug?: string };

const CAMPOS_EVENTO = `_id, title, vertical, inicio, fin, horaPorConfirmar, lugar, precioDesde, artista, organizador, descripcion, enlace, "slug": slug.current`;

/** Fecha (YYYY-MM-DD) y día de semana en Costa Rica. */
function hoyEnCR(): { fecha: string; diaSemana: string } {
  const ahora = new Date();
  return {
    fecha: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(ahora),
    diaSemana: new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Costa_Rica",
      weekday: "short",
    }).format(ahora),
  };
}

/** Suma días a una fecha YYYY-MM-DD (aritmética simple, sin TZ). */
function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00-06:00`);
  d.setDate(d.getDate() + dias);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(d);
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
  const { fecha: hoy, diaSemana } = hoyEnCR();
  const creados: string[] = [];
  const fallidos: { nota: string; motivo: string }[] = [];

  // ── A) Anuncios: eventos que ENTRARON a la agenda en las últimas 26 h ──
  const hace26h = new Date(Date.now() - 26 * 3600000).toISOString();
  const nuevos = await db.fetch<EventoCrudo[]>(
    /* groq */ `*[_type == "evento" && !(_id in path("drafts.**")) && _createdAt > $desde && defined(inicio) && inicio > now() && defined(slug.current)] | order(_createdAt asc)[0...10]{ ${CAMPOS_EVENTO} }`,
    { desde: hace26h }
  );
  const idsAnuncio = (nuevos ?? []).map(
    (e) => `cronica-anuncio-${e._id.replace(/[^a-zA-Z0-9-]/g, "")}`
  );
  const yaAnunciados = new Set<string>(
    idsAnuncio.length > 0
      ? await db.fetch<string[]>(/* groq */ `*[_id in $ids]._id`, {
          ids: idsAnuncio.flatMap((id) => [id, `drafts.${id}`]),
        })
      : []
  );
  const porAnunciar = (nuevos ?? []).filter((e, i) => {
    const id = idsAnuncio[i];
    return !yaAnunciados.has(id) && !yaAnunciados.has(`drafts.${id}`);
  });

  for (const e of porAnunciar.slice(0, MAX_ANUNCIOS_POR_CORRIDA)) {
    try {
      const articulo = await redactarNotaDeAgenda(
        `Escribí una NOTA DE ANUNCIO: este plan acaba de entrar a la agenda de Costa Rica y hay que contarlo.
Estructura: intro que diga qué se confirmó y por qué interesa (sección con subtitulo null), luego 1 o 2 secciones con subtítulo (los datos prácticos con SOLO lo provisto: cuándo, dónde, precios/entradas si hay; y contexto general del plan sin inventar cifras ni fechas). Cierre breve invitando a guardarlo. Entre 200 y 350 palabras.`,
        [e]
      );
      if (!articulo) {
        fallidos.push({ nota: `anuncio: ${e.title}`, motivo: "Redacción no válida." });
        continue;
      }
      const idArticulo = `cronica-anuncio-${e._id.replace(/[^a-zA-Z0-9-]/g, "")}`;
      await db.createIfNotExists({
        _id: `drafts.${idArticulo}`,
        _type: "cronica",
        title: articulo.titulo,
        slug: { _type: "slug", current: `viene-${e.slug}`.slice(0, 96) },
        vertical: e.vertical,
        bajada: articulo.bajada,
        autor: "Redacción SeViveLa",
        formato: "Nota",
        lecturaMin: minutosLectura(articulo),
        cuerpo: aPortableText(articulo),
        fecha: new Date().toISOString(),
        esPortada: false,
        destacada: false,
      });
      creados.push(`anuncio: ${articulo.titulo}`);
    } catch (err) {
      fallidos.push({
        nota: `anuncio: ${e.title}`,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  // ── B) Roundups fijos: lunes la semana, jueves el finde ──
  const roundup =
    diaSemana === "Mon"
      ? {
          id: `cronica-semana-${hoy}`,
          slug: `la-semana-en-planes-${hoy}`,
          desde: hoy,
          hasta: sumarDias(hoy, 7),
          encargo: `Escribí la AGENDA SEMANAL "La semana en planes": un recorrido editorial por los planes de los próximos siete días en Costa Rica.
Estructura: intro con el pulso de la semana (sección con subtitulo null) y 2 o 3 secciones con subtítulo agrupando los planes con criterio propio (por día, por tipo o por vibra). Mencioná CADA plan provisto con su día y lugar; prosa, nada de listas. Entre 400 y 600 palabras.`,
        }
      : diaSemana === "Thu"
        ? {
            id: `cronica-finde-${hoy}`,
            slug: `los-planes-del-finde-${hoy}`,
            desde: sumarDias(hoy, 1),
            hasta: sumarDias(hoy, 4),
            encargo: `Escribí la nota "Los planes del finde": qué hacer de viernes a domingo en Costa Rica.
Estructura: intro breve con el ánimo del fin de semana (sección con subtitulo null) y 2 o 3 secciones con subtítulo (por día o por plan fuerte). Mencioná CADA plan provisto con su día y lugar; prosa, nada de listas. Entre 300 y 500 palabras.`,
          }
        : null;

  if (roundup) {
    try {
      const existe = await db.fetch<string | null>(
        /* groq */ `*[_id in $ids][0]._id`,
        { ids: [roundup.id, `drafts.${roundup.id}`] }
      );
      if (!existe) {
        const eventos = await db.fetch<EventoCrudo[]>(
          /* groq */ `*[_type == "evento" && !(_id in path("drafts.**")) && defined(inicio) && inicio >= $desde && inicio < $hasta] | order(inicio asc)[0...12]{ ${CAMPOS_EVENTO} }`,
          {
            desde: `${roundup.desde}T00:00:00-06:00`,
            hasta: `${roundup.hasta}T00:00:00-06:00`,
          }
        );
        if ((eventos ?? []).length >= 2) {
          const articulo = await redactarNotaDeAgenda(roundup.encargo, eventos!);
          if (articulo) {
            await db.createIfNotExists({
              _id: `drafts.${roundup.id}`,
              _type: "cronica",
              title: articulo.titulo,
              slug: { _type: "slug", current: roundup.slug.slice(0, 96) },
              vertical: "ocio",
              bajada: articulo.bajada,
              autor: "Redacción SeViveLa",
              formato: "Agenda",
              lecturaMin: minutosLectura(articulo),
              cuerpo: aPortableText(articulo),
              fecha: new Date().toISOString(),
              esPortada: false,
              destacada: false,
            });
            creados.push(`roundup: ${articulo.titulo}`);
          } else {
            fallidos.push({ nota: roundup.slug, motivo: "Redacción no válida." });
          }
        }
      }
    } catch (err) {
      fallidos.push({
        nota: roundup.slug,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    creados,
    anunciosPendientes: Math.max(0, porAnunciar.length - MAX_ANUNCIOS_POR_CORRIDA),
    fallidos,
  });
}
