import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site, verticalsVisibles } from "@/lib/site";

/**
 * og:image por defecto del sitio (1200×630) generada con las fuentes de marca.
 * Crítica para el share en IG/TikTok/WhatsApp (canal principal de tráfico).
 * Las rutas con imagen propia (ej. dinámicas) la sobreescriben con su foto.
 */

export const runtime = "nodejs";
export const alt = `${site.name} · ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores de vertical (espejo de globals.css; satori no lee CSS vars)
const VERTICAL_COLORS: Record<string, string> = {
  entretenimiento: "#9a6a12",
  cultura: "#6d4fb0",
  experiencias: "#c25e00",
  ocio: "#35558a",
  "estilo-de-vida": "#3b1f87",
};

export default async function OpengraphImage() {
  const [fraunces, inter, logoSvg] = await Promise.all([
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#1a1526")
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f6f2fb",
          fontFamily: "Inter",
        }}
      >
        {/* banda lila de marca */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#a190d2",
            padding: "22px 64px",
            color: "#2e2840",
            fontSize: 22,
            letterSpacing: 4,
          }}
        >
          <span>SAN JOSÉ, COSTA RICA</span>
          <span>GUÍA VIVA DE LA REGIÓN</span>
        </div>

        {/* cuerpo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <img src={logoSrc} width={110} height={110} alt="" />
            <span
              style={{
                fontFamily: "Fraunces",
                fontSize: 64,
                color: "#1a1526",
              }}
            >
              {site.name}
            </span>
          </div>
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: 78,
              lineHeight: 1.05,
              color: "#1a1526",
              marginTop: 36,
              maxWidth: 1000,
            }}
          >
            {site.tagline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#5a5568",
              marginTop: 28,
            }}
          >
            {verticalsVisibles.map((v) => v.name).join("  ·  ")}
          </div>
        </div>

        {/* pie: regla magenta + puntos de color por vertical */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 64px 44px",
          }}
        >
          <div style={{ display: "flex", width: 88, height: 8, background: "#c71e70" }} />
          {verticalsVisibles.map((v) => VERTICAL_COLORS[v.slug] ?? "#3b1f87").map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                width: 18,
                height: 18,
                borderRadius: 999,
                background: c,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
    }
  );
}
