/**
 * Imagen descargable del cupón (PNG vertical, formato "ticket").
 * Pensada para guardarse en la galería del teléfono: la gente la muestra
 * en el local aunque no tenga señal. Solo se genera para cupones vigentes.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { getServiceClient } from "@/lib/supabase/server";
import { getBeneficio } from "@/lib/sanity/beneficio";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANCHO = 840;
const ALTO = 1240;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  if (!/^SV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return new Response("No encontrado", { status: 404 });
  }

  const db = getServiceClient();
  if (!db) return new Response("No disponible", { status: 503 });

  const { data: cupon } = await db
    .from("coupons")
    .select("benefit_slug, status, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!cupon) return new Response("No encontrado", { status: 404 });

  const vencido =
    cupon.status !== "issued" ||
    (cupon.expires_at && new Date(cupon.expires_at as string) <= new Date());
  if (vencido) return new Response("Cupón no vigente", { status: 410 });

  const [beneficio, fraunces, inter, logoSvg, qrDataUrl] = await Promise.all([
    getBeneficio(cupon.benefit_slug as string),
    readFile(join(process.cwd(), "app/og/fraunces-600.ttf")),
    readFile(join(process.cwd(), "app/og/inter-500.ttf")),
    readFile(join(process.cwd(), "public/logo.svg"), "utf8"),
    QRCode.toDataURL(`${site.url}/canjear?code=${code}`, {
      width: 440,
      margin: 1,
      color: { dark: "#1a1526", light: "#ffffff" },
    }),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${Buffer.from(
    logoSvg.replace(/currentColor/g, "#1a1526")
  ).toString("base64")}`;

  const vigencia = cupon.expires_at
    ? new Date(cupon.expires_at as string).toLocaleDateString("es-CR", {
        day: "numeric",
        month: "long",
        timeZone: "America/Costa_Rica",
      })
    : null;

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
          padding: 36,
        }}
      >
        {/* ── El ticket ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          {/* banda lila de marca */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#a190d2",
              padding: "26px 44px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img src={logoSrc} width={64} height={64} alt="" />
              <span
                style={{
                  fontSize: 24,
                  letterSpacing: 5,
                  color: "#1a1526",
                  fontWeight: 500,
                }}
              >
                TU CUPÓN
              </span>
            </div>
            <span style={{ fontSize: 20, letterSpacing: 3, color: "#2e2840" }}>
              UN SOLO USO
            </span>
          </div>

          {/* beneficio */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "38px 44px 0",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 22, letterSpacing: 4, color: "#666174" }}>
              {(beneficio?.marca ?? "SEVIVELA").toUpperCase()}
            </span>
            <span
              style={{
                fontFamily: "Fraunces",
                fontSize: 52,
                lineHeight: 1.08,
                color: "#1a1526",
                marginTop: 10,
              }}
            >
              {beneficio?.title ?? "Beneficio SeViveLa"}
            </span>
            {beneficio?.detalle ? (
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 500,
                  color: "#c71e70",
                  marginTop: 12,
                }}
              >
                {beneficio.detalle}
              </span>
            ) : null}
          </div>

          {/* QR + código */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "30px 44px 0",
            }}
          >
            <img src={qrDataUrl} width={440} height={440} alt="" />
            <span
              style={{
                fontSize: 46,
                fontWeight: 500,
                letterSpacing: 10,
                color: "#1a1526",
                marginTop: 20,
              }}
            >
              {code}
            </span>
          </div>

          {/* pie del ticket */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              borderTop: "3px dashed #ded7ee",
              margin: "30px 44px 0",
              padding: "24px 0 34px",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1.5, color: "#666174" }}>
              Mostrá este cupón en el local antes de pagar.
            </span>
            {vigencia ? (
              <span
                style={{
                  fontSize: 20,
                  letterSpacing: 2,
                  color: "#666174",
                  marginTop: 10,
                }}
              >
                {`VÁLIDO HASTA EL ${vigencia.toUpperCase()}`}
              </span>
            ) : null}
          </div>
        </div>

        {/* firma del sitio */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 22,
            fontSize: 22,
            letterSpacing: 3,
            color: "#666174",
          }}
        >
          {site.url.replace("https://", "")}
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: ALTO,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Inter", data: inter, weight: 500, style: "normal" },
      ],
      headers: {
        "Content-Disposition": `inline; filename="cupon-${code}.png"`,
        "Cache-Control": "private, no-store",
      },
    }
  );
}
