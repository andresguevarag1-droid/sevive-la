import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCronica } from "@/lib/sanity/cronica";
import { getVertical, site } from "@/lib/site";

/**
 * Historia de Instagram por crónica (1080×1920): foto del artículo, marco
 * brandeado lila, logo, frase clave (la bajada) y el link + @sevive.la
 * bien visibles. El botón "Instagram" de Compartir la descarga/comparte
 * lista para subir — el lector solo etiqueta o pega el link.
 * Si la crónica no existe, sale la tarjeta genérica de marca (nunca 500).
 */

export const runtime = "nodejs";

// Espejo de globals.css (satori no lee CSS vars)
const VERTICAL_HEX: Record<string, string> = {
  experiencias: "#c25e00",
  entretenimiento: "#9a6a12",
  cultura: "#6d4fb0",
  ocio: "#35558a",
  gastronomia: "#c42b52",
  turismo: "#0e6e86",
  "estilo-de-vida": "#3b1f87",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [c, fraunces, inter, logoSvg] = await Promise.all([
    getCronica(slug),
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#1a1526")
  ).toString("base64")}`;

  const color = VERTICAL_HEX[c?.vertical ?? ""] ?? "#a190d2";
  const vertical = c ? getVertical(c.vertical)?.name : undefined;
  const host = new URL(site.url).host;
  const titulo = c?.title ?? site.name;
  const bajada = c?.bajada;

  return new ImageResponse(
    (
      // Marco brandeado: lila de marca alrededor de todo el lienzo.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#a190d2",
          padding: 36,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#f6f2fb",
            borderRadius: 40,
            overflow: "hidden",
          }}
        >
          {/* Cabecera: logo sticker + sección */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "44px 56px 28px",
            }}
          >
            <img src={logoSrc} width={110} height={110} alt="" />
            {vertical ? (
              <span
                style={{
                  fontSize: 30,
                  letterSpacing: 6,
                  color,
                  textTransform: "uppercase",
                }}
              >
                {vertical}
              </span>
            ) : null}
          </div>

          {/* Foto del artículo (si tiene) */}
          {c?.imagen ? (
            <div style={{ display: "flex", padding: "0 56px" }}>
              <img
                src={c.imagen}
                width={968}
                height={760}
                style={{
                  width: 968,
                  height: 760,
                  objectFit: "cover",
                  borderRadius: 28,
                }}
                alt=""
              />
            </div>
          ) : null}

          {/* Título + frase clave */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "36px 56px",
            }}
          >
            <div
              style={{
                fontFamily: "Fraunces",
                fontSize: titulo.length > 70 ? 52 : titulo.length > 40 ? 62 : 74,
                lineHeight: 1.05,
                color: "#1a1526",
              }}
            >
              {titulo}
            </div>
            {bajada ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  fontSize: 34,
                  lineHeight: 1.35,
                  color: "#5a5568",
                  borderLeft: `10px solid ${color}`,
                  paddingLeft: 28,
                }}
              >
                {bajada.length > 170 ? `${bajada.slice(0, 167)}…` : bajada}
              </div>
            ) : null}
          </div>

          {/* Pie: link + arroba, sobre banda de tinta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#1a1526",
              padding: "34px 56px",
            }}
          >
            <span style={{ fontSize: 30, color: "#f6f2fb" }}>
              {c ? `${host}/cronica/${c.slug}` : host}
            </span>
            <span style={{ fontSize: 30, fontWeight: 500, color: "#cabce9" }}>
              @sevive.la
            </span>
          </div>

          {/* Filete final: color de vertical + magenta de marca */}
          <div style={{ display: "flex", height: 16 }}>
            <div style={{ display: "flex", flex: 1, background: color }} />
            <div style={{ display: "flex", width: 300, background: "#c71e70" }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
      headers: {
        // La historia de una crónica no cambia: cache larga en el CDN.
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "Content-Disposition": 'inline; filename="sevivela-historia.png"',
      },
    }
  );
}
