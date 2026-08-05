"use client";

/**
 * Cupón RECORTABLE estilo sticker del logo: marco punteado de tijera
 * alrededor, tarjeta con borde blanco grueso (como los bloques "SE VIVE
 * LA!"), levemente inclinada — se endereza al pasar el cursor —, oferta
 * en bloque-sticker negro con "!" magenta, perforación interna y código
 * de barras de imprenta. El estado personal se resuelve en cliente: si ya
 * reclamó el cupón (sv_cupones), el cierre lleva directo a su QR.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";

export type DatosTarjeta = {
  id: string;
  href: string;
  slug: string;
  marca?: string;
  patrocinado?: boolean;
  titulo: string;
  verticalNombre?: string;
  color: string;
  ofertaGrande: string;
  ofertaResto?: string;
  /** Arte del cupón (Studio): sustituye el cabezal de color por la imagen. */
  img?: string;
  /** Sticker de urgencia ("¡Vence hoy!", "Quedan 8"…); brand = magenta. */
  urgencia?: { texto: string; brand: boolean }[];
  /** Prueba social: cupones ya reclamados (se muestra desde 3). */
  emitidos?: number;
  agotado?: boolean;
  /** Inclinación del sticker ("-rotate-1"…): se endereza al hover. */
  giro?: string;
  /** true cuando la sección tiene fondo lila (línea de recorte en blanco). */
  sobreLila?: boolean;
};

/** Cupones reclamados en este dispositivo: { [slugBeneficio]: code }. */
export function leerMisCupones(): Record<string, string> {
  try {
    const raw = localStorage.getItem("sv_cupones");
    const m = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return m && typeof m === "object" ? m : {};
  } catch {
    return {};
  }
}

function Tijeras({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88" />
      <path d="M14.47 14.48 20 20" />
      <path d="M8.12 8.12 12 12" />
    </svg>
  );
}

export function TarjetaBeneficio(d: DatosTarjeta) {
  const [miCodigo, setMiCodigo] = useState<string | null>(null);
  useEffect(() => {
    setMiCodigo(leerMisCupones()[d.slug] ?? null);
  }, [d.slug]);

  const yaLoTiene = Boolean(miCodigo);
  const destino = yaLoTiene ? `/mi-cupon/${miCodigo}` : d.href;
  // La oferta solo va como sticker/gigante si es una cifra corta ("30%",
  // "2×1"); una frase larga se muestra como texto normal en el cuerpo.
  const ofertaCorta = d.ofertaGrande.length <= 12;

  return (
    <div data-reveal className="relative pt-2">
      {/* ── Línea de recorte: punteada, con la tijera entrando ── */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 rounded-[18px] border-2 border-dashed ${
          d.sobreLila ? "border-white/60" : "border-ink/25"
        }`}
      />
      <Tijeras
        className={`absolute -top-[9px] left-7 z-10 ${d.sobreLila ? "text-white/85" : "text-ink/50"}`}
      />

      <Link
        href={destino}
        className={`${d.giro ?? "-rotate-1"} pressable group m-2.5 flex flex-col overflow-hidden rounded-[12px] border-[3px] border-white bg-white shadow-[0_16px_36px_-14px_rgba(26,21,38,0.4)] transition-[transform,box-shadow] duration-300 hover:rotate-0 hover:shadow-[0_22px_44px_-14px_rgba(26,21,38,0.5)]`}
        style={{ display: "flex" }}
      >
        {/* ── Cabezal: arte de la marca o color con la oferta gigante ── */}
        <div
          className="relative flex items-center justify-center overflow-hidden px-5 py-6 text-center text-white"
          style={{ background: d.agotado ? "#8a8494" : d.color, aspectRatio: "16 / 9" }}
        >
          {d.img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={d.img}
              alt=""
              loading="lazy"
              decoding="async"
              className={`imgzoom absolute inset-0 h-full w-full object-cover ${
                d.agotado ? "opacity-40 grayscale" : ""
              }`}
            />
          ) : ofertaCorta ? (
            <p className="tnum text-[clamp(2.2rem,6vw,3rem)] font-black uppercase leading-none tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
              {d.ofertaGrande}
              <span className="text-brand">!</span>
            </p>
          ) : (
            <p className="text-[clamp(1rem,2.6vw,1.25rem)] font-black uppercase leading-snug tracking-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]">
              {d.ofertaGrande}
            </p>
          )}

          {/* Sticker de urgencia estilo logo */}
          {d.urgencia?.length ? (
            <div className="absolute right-3 top-3 flex gap-1.5">
              {d.urgencia.map((u) => (
                <span
                  key={u.texto}
                  className={`rotate-2 whitespace-nowrap rounded-[5px] border-2 border-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] ${
                    u.brand ? "bg-brand" : "bg-ink"
                  }`}
                >
                  {u.texto}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Perforación interna con muescas ── */}
        <div aria-hidden className="relative h-0 border-t-2 border-dashed border-rule">
          <span
            className="absolute -left-3 -top-2.5 h-5 w-5 rounded-full"
            style={{ background: d.sobreLila ? "var(--color-lilac)" : "var(--color-paper)" }}
          />
          <span
            className="absolute -right-3 -top-2.5 h-5 w-5 rounded-full"
            style={{ background: d.sobreLila ? "var(--color-lilac)" : "var(--color-paper)" }}
          />
        </div>

        {/* ── Cuerpo del cupón ── */}
        <div className="relative flex flex-1 flex-col px-4 pb-4 pt-4">
          {/* La oferta, como bloque del logo, montada sobre la perforación
              (solo cuando es una cifra corta; una frase larga iría enorme) */}
          {d.img && ofertaCorta ? (
            <span
              className={`absolute -top-5 left-4 -rotate-2 rounded-[6px] border-[3px] border-white px-3 py-1 text-base font-black uppercase tracking-tight text-white shadow-[0_10px_22px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 ${
                d.agotado ? "bg-[#8a8494]" : "bg-ink"
              }`}
            >
              <span className="tnum">{d.ofertaGrande}</span>
              <span className="text-brand">!</span>
            </span>
          ) : null}

          <p className={`label text-faint ${d.img && ofertaCorta ? "mt-3" : ""}`}>
            {d.marca}
            {d.patrocinado ? " · Patrocinado" : ""}
          </p>
          <h3 className="mt-1.5 text-[17px] font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
            {d.titulo}
          </h3>
          {d.img && !ofertaCorta ? (
            <p className="mt-1.5 text-sm font-semibold leading-snug text-ink/85">
              {d.ofertaGrande}
            </p>
          ) : null}
          {d.ofertaResto ? (
            <p className="label mt-1.5 text-muted">{d.ofertaResto}</p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="label" style={{ color: d.color }}>
              {d.verticalNombre}
            </span>
            {typeof d.emitidos === "number" && d.emitidos >= 3 ? (
              <span className="tnum text-[12px] font-medium text-muted">
                · {d.emitidos} ya lo reclamaron
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <p className="label flex items-center gap-1.5 text-brand">
              {yaLoTiene
                ? "Ya lo tenés · Ver mi cupón"
                : d.agotado
                  ? "Ver detalle"
                  : "Recortar cupón"}
              <ArrowRightIcon
                width={14}
                height={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </p>
            {/* Código de barras de imprenta (detalle editorial) */}
            <span aria-hidden className="flex flex-col items-end gap-0.5 opacity-60">
              <span
                className="h-5 w-16"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, var(--color-ink) 0 1.5px, transparent 1.5px 3px, var(--color-ink) 3px 5.5px, transparent 5.5px 7px)",
                }}
              />
              <span className="tnum text-[8px] tracking-[0.3em] text-faint">SEVIVELA</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
