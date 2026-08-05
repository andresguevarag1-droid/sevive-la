"use client";

/**
 * Tarjeta de cupón (cliente): recibe todo pre-calculado del servidor y
 * agrega el ESTADO PERSONAL — si esta persona ya reclamó el cupón (mapa
 * sv_cupones en localStorage), el cierre cambia a "Ya lo tenés" y el link
 * va directo a su QR en /mi-cupon/<code>. Sin punto muerto.
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
  /** Sticker de urgencia ("¡Vence hoy!", "Quedan 8"…); brand = magenta. */
  urgencia?: { texto: string; brand: boolean }[];
  /** Prueba social: cupones ya reclamados (se muestra desde 3). */
  emitidos?: number;
  agotado?: boolean;
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

export function TarjetaBeneficio(d: DatosTarjeta) {
  const [miCodigo, setMiCodigo] = useState<string | null>(null);
  useEffect(() => {
    setMiCodigo(leerMisCupones()[d.slug] ?? null);
  }, [d.slug]);

  const yaLoTiene = Boolean(miCodigo);
  const destino = yaLoTiene ? `/mi-cupon/${miCodigo}` : d.href;

  return (
    <Link
      href={destino}
      data-reveal
      className="card pressable group relative flex overflow-hidden"
    >
      {/* ── Cuerpo del cupón ── */}
      <div className="flex min-w-0 flex-1 flex-col px-5 py-5">
        <p className="label text-faint">
          {d.marca}
          {d.patrocinado ? " · Patrocinado" : ""}
        </p>
        <h3 className="mt-1.5 text-xl font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
          {d.titulo}
        </h3>
        <p className="label mt-1.5" style={{ color: d.color }}>
          {d.verticalNombre}
        </p>
        {typeof d.emitidos === "number" && d.emitidos >= 3 ? (
          <p className="tnum mt-2 text-[12px] font-medium text-muted">
            {d.emitidos} personas ya lo reclamaron
          </p>
        ) : null}
        <p className="label mt-auto flex items-center gap-1.5 pt-5 text-brand">
          {yaLoTiene ? "Ya lo tenés · Ver mi cupón" : d.agotado ? "Ver detalle" : "Ver beneficio"}
          <ArrowRightIcon
            width={14}
            height={14}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </p>
      </div>

      {/* ── Perforación: punteado con muescas troqueladas ── */}
      <div aria-hidden className="relative w-0 border-l border-dashed border-rule">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-paper" />
        <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-paper" />
      </div>

      {/* ── Talón sólido: la oferta manda ── */}
      <div
        className="relative flex w-[40%] max-w-44 shrink-0 flex-col items-center justify-center px-4 py-6 text-center text-white"
        style={{ background: d.agotado ? "#8a8494" : d.color }}
      >
        <p className="tnum text-[clamp(1.7rem,4vw,2.2rem)] font-black uppercase leading-none tracking-tight">
          {d.ofertaGrande}
        </p>
        {d.ofertaResto ? (
          <p className="label mt-2 text-white/85">{d.ofertaResto}</p>
        ) : null}
        {/* Stickers de urgencia estilo logo, colgados sobre el talón */}
        {d.urgencia?.length ? (
          <div className="absolute -top-1.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {d.urgencia.map((u) => (
              <span
                key={u.texto}
                className={`-rotate-2 whitespace-nowrap rounded-[4px] border-2 border-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-[0_5px_12px_-5px_rgba(0,0,0,0.45)] ${
                  u.brand ? "bg-brand" : "bg-ink"
                }`}
              >
                {u.texto}
              </span>
            ))}
          </div>
        ) : null}
        <span
          aria-hidden
          className="label absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-white/40"
          style={{ writingMode: "vertical-rl" }}
        >
          SEVIVELA
        </span>
      </div>
    </Link>
  );
}
