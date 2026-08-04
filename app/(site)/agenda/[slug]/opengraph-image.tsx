import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getEvento } from "@/lib/sanity/evento";
import { getVertical, site } from "@/lib/site";

/**
 * og:image por evento (1200×630): tarjeta de marca con título, fecha y lugar.
 * Todo evento compartido en WhatsApp/IG muestra previsualización aunque no
 * tenga foto propia — el link compartido es el canal de adquisición.
 */

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Evento en la agenda de SeViveLa";

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

function fmtFecha(iso: string, conHora: boolean): string {
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

export default async function OgEvento({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [e, fraunces, inter, logoSvg] = await Promise.all([
    getEvento(slug),
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#1a1526")
  ).toString("base64")}`;

  const color = VERTICAL_HEX[e?.vertical ?? ""] ?? "#a190d2";
  const vertical = e ? getVertical(e.vertical)?.name : undefined;
  const fecha = e ? fmtFecha(e.inicio, !e.horaPorConfirmar) : "";

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
            padding: "20px 60px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={logoSrc} width={62} height={62} alt="" />
            <span style={{ fontSize: 22, letterSpacing: 5, color: "#1a1526" }}>
              AGENDA
            </span>
          </div>
          {vertical ? (
            <span style={{ fontSize: 20, letterSpacing: 3, color: "#2e2840" }}>
              {vertical.toUpperCase()}
            </span>
          ) : null}
        </div>

        {/* cuerpo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 60px",
          }}
        >
          <div
            style={{
              fontFamily: "Fraunces",
              fontSize: e && e.title.length > 46 ? 58 : 72,
              lineHeight: 1.04,
              color: "#1a1526",
              maxWidth: 1050,
            }}
          >
            {e?.title ?? `${site.name} · Agenda`}
          </div>
          {e ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 30,
                fontSize: 30,
                color: "#5a5568",
              }}
            >
              <span style={{ fontWeight: 500, color: "#1a1526" }}>{fecha}</span>
              {e.lugar ? <span style={{ marginTop: 8 }}>{e.lugar}</span> : null}
            </div>
          ) : null}
        </div>

        {/* pie: barra del color de la vertical + magenta de marca */}
        <div style={{ display: "flex", height: 14 }}>
          <div style={{ display: "flex", flex: 1, background: color }} />
          <div style={{ display: "flex", width: 240, background: "#c71e70" }} />
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
