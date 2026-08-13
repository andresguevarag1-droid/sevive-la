import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

/**
 * Plantilla ÚNICA de historias de Instagram (1080×1920) — SOLO SERVIDOR.
 * Marco lila de marca, logo, foto, titular serif, frase con filete del
 * color de la vertical, líneas de datos y pie con link + @sevive.la.
 * Todas las historias del sitio (crónica, evento, dinámica, cupón) salen
 * de aquí: un solo lugar para retocar el diseño de marca.
 */

// Espejo de globals.css (satori no lee CSS vars)
export const VERTICAL_HEX: Record<string, string> = {
  experiencias: "#c25e00",
  entretenimiento: "#9a6a12",
  cultura: "#6d4fb0",
  ocio: "#35558a",
  gastronomia: "#c42b52",
  turismo: "#0e6e86",
  "estilo-de-vida": "#3b1f87",
};

export type DatosHistoria = {
  /** Rótulo superior derecho (vertical, marca del cupón…). */
  kicker?: string;
  titulo: string;
  /** Frase clave con filete de color (bajada, premio, detalle…). */
  frase?: string;
  /** Líneas de datos (fecha, lugar, precio…); `fuerte` = en tinta. */
  lineas?: { texto: string; fuerte?: boolean }[];
  /** URL absoluta de la foto (CDN de Sanity) — opcional. */
  imagen?: string;
  /** Color de acento (vertical). */
  color: string;
  /** Ruta en el sitio, para el pie ("/agenda/<slug>"). */
  path: string;
};

export async function imagenHistoria(datos: DatosHistoria): Promise<ImageResponse> {
  const [fraunces, inter, logoSvg] = await Promise.all([
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#1a1526")
  ).toString("base64")}`;
  const host = new URL(site.url).host;
  const { kicker, titulo, frase, lineas, imagen, color, path } = datos;
  // Sin foto, el texto ocupa el lienzo (tipografía protagonista, ley de la casa).
  const conFoto = Boolean(imagen);

  return new ImageResponse(
    (
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
          {/* Cabecera: logo sticker + rótulo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "44px 56px 28px",
            }}
          >
            <img src={logoSrc} width={110} height={110} alt="" />
            {kicker ? (
              <span
                style={{
                  fontSize: 30,
                  letterSpacing: 6,
                  color,
                  textTransform: "uppercase",
                }}
              >
                {kicker}
              </span>
            ) : null}
          </div>

          {/* Foto (si hay) */}
          {conFoto ? (
            <div style={{ display: "flex", padding: "0 56px" }}>
              <img
                src={imagen}
                width={968}
                height={720}
                style={{
                  width: 968,
                  height: 720,
                  objectFit: "cover",
                  borderRadius: 28,
                }}
                alt=""
              />
            </div>
          ) : null}

          {/* Titular + frase + datos */}
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
                fontSize: conFoto
                  ? titulo.length > 70
                    ? 50
                    : titulo.length > 40
                      ? 60
                      : 72
                  : titulo.length > 70
                    ? 64
                    : 84,
                lineHeight: 1.05,
                color: "#1a1526",
              }}
            >
              {titulo}
            </div>
            {frase ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  fontSize: conFoto ? 33 : 38,
                  lineHeight: 1.35,
                  color: "#5a5568",
                  borderLeft: `10px solid ${color}`,
                  paddingLeft: 28,
                }}
              >
                {frase.length > 170 ? `${frase.slice(0, 167)}…` : frase}
              </div>
            ) : null}
            {lineas?.length ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 30,
                  fontSize: 34,
                  lineHeight: 1.5,
                }}
              >
                {lineas.map((l, i) => (
                  <span
                    key={i}
                    style={{ color: l.fuerte ? "#1a1526" : "#5a5568" }}
                  >
                    {l.texto}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Pie: link + arroba sobre banda de tinta */}
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
              {host}
              {path}
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
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "Content-Disposition": 'inline; filename="sevivela-historia.png"',
      },
    }
  );
}

/** Fecha editorial en horario de Costa Rica ("viernes 22 de agosto, 19:00"). */
export function fechaHistoriaCR(iso?: string, conHora = true): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(conHora ? { hour: "2-digit" as const, minute: "2-digit" as const, hour12: false } : {}),
    timeZone: "America/Costa_Rica",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
