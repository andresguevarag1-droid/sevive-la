import { NextResponse } from "next/server";
import { getCronica } from "@/lib/sanity/cronica";
import { getEvento } from "@/lib/sanity/evento";
import { getDinamica } from "@/lib/sanity/dinamica";
import { getBeneficio } from "@/lib/sanity/beneficio";
import { getVertical, site } from "@/lib/site";
import {
  imagenHistoria,
  fechaHistoriaCR,
  VERTICAL_HEX,
  type DatosHistoria,
} from "@/lib/server/historia";

/**
 * Historias de Instagram (1080×1920) por contenido:
 *   /api/historia/cronica/<slug>   → foto + titular + bajada
 *   /api/historia/evento/<slug>    → foto + fecha, lugar y precio
 *   /api/historia/dinamica/<slug>  → premio + "participá gratis hasta…"
 *   /api/historia/beneficio/<slug> → cupón: marca + detalle + vigencia
 * Todas con el marco de marca (plantilla única en lib/server/historia).
 * Contenido inexistente → tarjeta genérica del sitio (nunca 500).
 */

export const runtime = "nodejs";

async function datosPorTipo(tipo: string, slug: string): Promise<DatosHistoria | null> {
  if (tipo === "cronica") {
    const c = await getCronica(slug);
    if (!c) return null;
    return {
      kicker: getVertical(c.vertical)?.name,
      titulo: c.title,
      frase: c.bajada,
      imagen: c.imagen,
      color: VERTICAL_HEX[c.vertical] ?? "#a190d2",
      path: `/cronica/${c.slug}`,
    };
  }
  if (tipo === "evento") {
    const e = await getEvento(slug);
    if (!e) return null;
    return {
      kicker: getVertical(e.vertical)?.name,
      titulo: e.title,
      imagen: e.imagen,
      lineas: [
        { texto: fechaHistoriaCR(e.inicio, !e.horaPorConfirmar), fuerte: true },
        ...(e.lugar ? [{ texto: e.lugar }] : []),
        ...(e.precioDesde ? [{ texto: e.precioDesde }] : []),
      ],
      color: VERTICAL_HEX[e.vertical] ?? "#a190d2",
      path: `/agenda/${e.slug}`,
    };
  }
  if (tipo === "dinamica") {
    const d = await getDinamica(slug);
    if (!d) return null;
    return {
      kicker: d.marca ?? "Dinámica",
      titulo: d.title,
      frase: d.premio,
      imagen: d.imagen,
      lineas: [
        {
          texto: `Participá GRATIS hasta el ${fechaHistoriaCR(d.cierre, false).toLowerCase()}`,
          fuerte: true,
        },
      ],
      color: VERTICAL_HEX[d.vertical] ?? "#a190d2",
      path: `/dinamicas/${d.slug}`,
    };
  }
  if (tipo === "beneficio") {
    const b = await getBeneficio(slug);
    if (!b) return null;
    return {
      kicker: b.marca,
      titulo: b.title,
      frase: b.detalle,
      imagen: b.img,
      lineas: b.vigencia
        ? [
            {
              // vigencia es fecha sin hora: válida TODO su día en CR.
              texto: `Válido hasta el ${fechaHistoriaCR(`${b.vigencia}T12:00:00-06:00`, false).toLowerCase()}`,
              fuerte: true,
            },
          ]
        : [],
      color: VERTICAL_HEX[b.vertical] ?? "#a190d2",
      path: `/promociones/${b.slug}`,
    };
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tipo: string; slug: string }> }
) {
  const { tipo, slug } = await params;
  if (!["cronica", "evento", "dinamica", "beneficio"].includes(tipo)) {
    return NextResponse.json({ ok: false, error: "Tipo no válido." }, { status: 404 });
  }
  const datos = await datosPorTipo(tipo, slug);
  // Falla de datos → tarjeta genérica de marca (el compartir nunca revienta).
  return imagenHistoria(
    datos ?? {
      titulo: site.name,
      frase: site.description,
      color: "#a190d2",
      path: "",
    }
  );
}
