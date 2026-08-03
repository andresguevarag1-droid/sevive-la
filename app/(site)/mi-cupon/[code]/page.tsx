import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { getServiceClient } from "@/lib/supabase/server";
import { getBeneficio } from "@/lib/sanity/beneficio";
import { site } from "@/lib/site";

type Params = { code: string };

// El estado del cupón debe estar fresco (canjeado/vencido cambia en vivo).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cupón",
  robots: { index: false },
};

/** Estado visible del cupón. */
function estadoCupon(c: { status: string; expires_at: string | null }) {
  if (c.status === "redeemed") return "canjeado" as const;
  if (
    c.status === "expired" ||
    c.status === "void" ||
    (c.expires_at && new Date(c.expires_at) <= new Date())
  )
    return "vencido" as const;
  return "vigente" as const;
}

export default async function MiCuponPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).toUpperCase();
  if (!/^SV-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) notFound();

  const db = getServiceClient();
  if (!db) {
    // Config ausente ≠ cupón inexistente: no confundir al cliente con un 404.
    return (
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="label text-faint">Un momento</p>
        <h1 className="mt-3 text-2xl">No podemos mostrar tu cupón ahora.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Estamos en mantenimiento. Tu cupón sigue siendo válido — probá de
          nuevo en unos minutos o buscá el código en tu correo.
        </p>
      </section>
    );
  }

  const { data: cupon } = await db
    .from("coupons")
    .select("benefit_slug, status, issued_at, expires_at, redeemed_at")
    .eq("code", code)
    .maybeSingle();
  if (!cupon) notFound();

  const beneficio = await getBeneficio(cupon.benefit_slug as string);
  const estado = estadoCupon(cupon as { status: string; expires_at: string | null });

  // El QR codifica la URL de canje del STAFF (exige PIN del local):
  // el usuario no puede autocanjearse.
  const qrDataUrl = await QRCode.toDataURL(
    `${site.url}/canjear?code=${code}`,
    { width: 480, margin: 1, color: { dark: "#1a1526", light: "#ffffff" } }
  );

  return (
    <section className="mx-auto max-w-md px-4 py-10 md:py-14">
      <p className="label text-faint">Tu cupón de SeViveLa</p>
      {beneficio ? (
        <>
          <p className="label mt-3 text-faint">{beneficio.marca}</p>
          <h1 className="mt-1 text-3xl">{beneficio.title}</h1>
          <p className="tnum mt-2 text-lg font-bold text-brand">{beneficio.detalle}</p>
        </>
      ) : (
        <h1 className="mt-3 text-3xl">Cupón {code}</h1>
      )}

      {/* ── El cupón ── */}
      <div className="card mt-6 overflow-hidden text-center">
        <div
          className="px-6 py-3"
          style={{
            background:
              estado === "vigente" ? "var(--color-lilac)" : "var(--color-paper-2)",
          }}
        >
          <p className="label text-ink">
            {estado === "vigente"
              ? "Vigente · Un solo uso"
              : estado === "canjeado"
                ? "Ya canjeado"
                : "Vencido"}
          </p>
        </div>
        <div className={`px-6 py-8 ${estado !== "vigente" ? "opacity-40" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`Código QR del cupón ${code}`}
            width={240}
            height={240}
            className="mx-auto h-60 w-60"
          />
          <p className="tnum mt-5 text-2xl font-extrabold tracking-[0.15em] text-ink">
            {code}
          </p>
        </div>
        <div className="border-t border-dashed border-rule px-6 py-4">
          <p className="text-sm leading-relaxed text-muted">
            {estado === "canjeado"
              ? `Canjeado el ${new Date(cupon.redeemed_at as string).toLocaleDateString("es-CR", { day: "numeric", month: "long", timeZone: "America/Costa_Rica" })}. ¡Que lo hayás disfrutado!`
              : estado === "vencido"
                ? "Este cupón ya venció."
                : (beneficio?.instruccionesCanje ??
                  "Mostrá este código (o el QR) en el local antes de pagar.")}
          </p>
          {estado === "vigente" && cupon.expires_at ? (
            <p className="label tnum mt-2 text-faint">
              Válido hasta el{" "}
              {new Date(cupon.expires_at as string).toLocaleDateString("es-CR", {
                day: "numeric",
                month: "long",
                timeZone: "America/Costa_Rica",
              })}
            </p>
          ) : null}
        </div>
      </div>

      {estado === "vigente" ? (
        <div className="mt-5 text-center">
          <a
            href={`/mi-cupon/${code}/imagen`}
            target="_blank"
            rel="noopener"
            className="pressable inline-block w-full border-2 border-ink px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Guardar imagen del cupón
          </a>
          <p className="label mt-2 text-faint">
            Se abre como imagen: mantenela presionada para guardarla en tus fotos.
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-center">
        <Link href="/promociones" className="text-sm text-muted underline">
          Ver más beneficios
        </Link>
      </p>
    </section>
  );
}
