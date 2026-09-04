/**
 * Revisor editorial de los borradores del robot (CRON_SECRET, manual):
 *   curl -H "Authorization: Bearer $CRON_SECRET" .../api/admin/revisar-articulos
 *
 * Por cada borrador de crónica escrito por la redacción automática:
 *  1. Claude lo pasa por corrección de estilo (ortografía, gramática,
 *     voseo, muletillas) SIN tocar datos duros.
 *  2. Si quedó completo → se PUBLICA (y el borrador desaparece).
 *  3. Si trae marcadores [COMPLETAR: …] (esqueletos de cobertura) → se
 *     guarda corregido pero SIGUE en borrador: falta lo vivencial del
 *     equipo y eso no se publica con huecos.
 * Solo toca borradores con autor "Redacción SeViveLa": lo que escribe el
 * equipo a mano jamás se publica ni se corrige solo. Idempotente: lo
 * publicado sale de la lista en la corrida siguiente.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";
import { redaccionHabilitada, revisarArticulo } from "@/lib/server/redaccion";
import {
  aPortableText,
  desdePortableText,
  minutosLectura,
} from "@/lib/server/articulo-pt";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Tope por corrida (cada revisión es una llamada a Claude). */
const MAX_POR_CORRIDA = 4;

type BorradorCrudo = {
  _id: string;
  title: string;
  slug?: { current?: string };
  vertical?: string;
  bajada?: string;
  autor?: string;
  formato?: string;
  fecha?: string;
  esPortada?: boolean;
  destacada?: boolean;
  cuerpo?: { _type?: string; style?: string; children?: { text?: string }[] }[];
};

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

  // ── Rescate: crónicas del robot PUBLICADAS con apuntes [COMPLETAR: …]
  // a la vista (se publicaron sin llenar). Vuelven a borrador YA: nada
  // con huecos internos se queda al aire. ──
  const despublicados: string[] = [];
  const filtradas = await db.fetch<BorradorCrudo[]>(
    /* groq */ `*[_type == "cronica" && !(_id in path("drafts.**")) && autor == "Redacción SeViveLa"]{
      _id, title, slug, vertical, bajada, autor, formato, fecha, esPortada, destacada, cuerpo
    }`
  );
  const rutasBajadas = new Set<string>();
  for (const c of filtradas ?? []) {
    const textos = (c.cuerpo ?? [])
      .flatMap((b) => b.children ?? [])
      .map((s) => s.text ?? "")
      .join("\n");
    if (!textos.includes("[COMPLETAR")) continue;
    try {
      const { _id, ...resto } = c;
      await db
        .transaction()
        .createOrReplace({ ...resto, _id: `drafts.${_id}`, _type: "cronica" })
        .delete(_id)
        .commit();
      despublicados.push(c.title);
      if (c.slug?.current) rutasBajadas.add(`/cronica/${c.slug.current}`);
      if (c.vertical) rutasBajadas.add(`/${c.vertical}`);
    } catch (err) {
      console.error(`[revisar] no se pudo despublicar "${c.title}":`, err);
    }
  }
  if (despublicados.length > 0) {
    revalidatePath("/");
    for (const ruta of rutasBajadas) revalidatePath(ruta);
  }

  const borradores = await db.fetch<BorradorCrudo[]>(
    /* groq */ `*[_id in path("drafts.**") && _type == "cronica" && autor == "Redacción SeViveLa"] | order(_updatedAt asc)[0...20]{
      _id, title, slug, vertical, bajada, autor, formato, fecha, esPortada, destacada, cuerpo
    }`
  );

  const publicados: { titulo: string; cambios: string[] }[] = [];
  const enBorrador: { titulo: string; motivo: string; cambios: string[] }[] = [];
  const fallidos: { titulo: string; motivo: string }[] = [];
  const rutasARefrescar = new Set<string>(["/"]);

  for (const b of (borradores ?? []).slice(0, MAX_POR_CORRIDA)) {
    try {
      const secciones = desdePortableText(b.cuerpo);
      if (secciones.length === 0 || !b.slug?.current) {
        fallidos.push({
          titulo: b.title,
          motivo: "Cuerpo vacío o sin slug: revisarlo a mano en el Studio.",
        });
        continue;
      }
      const revision = await revisarArticulo({
        titulo: b.title,
        bajada: b.bajada ?? "",
        secciones,
      });
      if (!revision) {
        fallidos.push({
          titulo: b.title,
          motivo: "La revisión no devolvió un artículo válido.",
        });
        continue;
      }
      const { articulo, cambios } = revision;
      const documento = {
        _type: "cronica",
        title: articulo.titulo,
        slug: b.slug,
        vertical: b.vertical,
        bajada: articulo.bajada,
        autor: b.autor,
        formato: b.formato,
        lecturaMin: minutosLectura(articulo),
        cuerpo: aPortableText(articulo),
        fecha: b.fecha ?? new Date().toISOString(),
        esPortada: b.esPortada ?? false,
        destacada: b.destacada ?? false,
      };

      const tieneMarcadores = JSON.stringify(articulo).includes("[COMPLETAR");
      if (tieneMarcadores) {
        // Esqueleto de cobertura: corregido, pero espera al equipo.
        await db.createOrReplace({ ...documento, _id: b._id });
        enBorrador.push({
          titulo: articulo.titulo,
          motivo: "Tiene marcadores [COMPLETAR: …]: el equipo agrega lo vivencial y publica.",
          cambios,
        });
        continue;
      }

      // Publicar: el documento pasa a su _id público y el borrador se va.
      const idPublico = b._id.replace(/^drafts\./, "");
      await db
        .transaction()
        .createOrReplace({ ...documento, _id: idPublico })
        .delete(b._id)
        .commit();
      publicados.push({ titulo: articulo.titulo, cambios });
      rutasARefrescar.add(`/cronica/${b.slug.current}`);
      if (b.vertical) rutasARefrescar.add(`/${b.vertical}`);
    } catch (err) {
      fallidos.push({
        titulo: b.title,
        motivo: (err instanceof Error ? err.message : String(err)).slice(0, 300),
      });
    }
  }

  if (publicados.length > 0) {
    for (const ruta of rutasARefrescar) revalidatePath(ruta);
  }

  return NextResponse.json({
    ok: fallidos.length === 0,
    borradoresDelRobot: borradores?.length ?? 0,
    despublicadosPorMarcadores: despublicados,
    publicados,
    quedanEnBorrador: enBorrador,
    fallidos,
    pendientesProximaCorrida: Math.max(
      0,
      (borradores?.length ?? 0) - MAX_POR_CORRIDA
    ),
  });
}
