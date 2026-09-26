import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";
import { VERTICAL_HEX } from "@/lib/server/historia";

/**
 * Portada de marca (1200×800, 3:2) para crónicas que nacen SIN foto propia
 * (las notas de anuncio y los roundups del redactor de planta): en vez del
 * recuadro gris "SeViveLa" vacío en las tarjetas/carrusel, un fondo de
 * marca con el titular — misma familia visual que opengraph-image.tsx.
 * SOLO SERVIDOR: se sube como asset de Sanity al crear la crónica, nunca
 * se sirve como ruta.
 */
export async function portadaGenerada(
  titulo: string,
  vertical: string
): Promise<Buffer> {
  const [fraunces, inter, logoSvg] = await Promise.all([
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#ffffff")
  ).toString("base64")}`;
  const color = VERTICAL_HEX[vertical] ?? "#3b1f87";

  const respuesta = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: color,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "48px 56px 0",
          }}
        >
          <img src={logoSrc} width={40} height={40} alt="" />
          <span style={{ color: "#fff", fontSize: 22, letterSpacing: 3, opacity: 0.9 }}>
            {site.name.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            padding: "0 56px 56px",
          }}
        >
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 56,
              lineHeight: 1.08,
              color: "#fff",
              maxWidth: 1000,
            }}
          >
            {titulo}
          </div>
        </div>
        <div aria-hidden style={{ display: "flex", height: 14, background: "#c71e70" }} />
      </div>
    ),
    {
      width: 1200,
      height: 800,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
    }
  );
  return Buffer.from(await respuesta.arrayBuffer());
}
