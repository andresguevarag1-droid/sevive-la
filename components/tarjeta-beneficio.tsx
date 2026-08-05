"use client";

/**
 * Cupón como TICKET VERTICAL (mobile-first): arte de la marca a todo el
 * ancho arriba, perforación horizontal con muescas y el cuerpo abajo.
 * Sin imagen, el cabezal es el color de la vertical con la oferta gigante.
 * El estado personal se resuelve en cliente: si esta persona ya reclamó
 * el cupón (sv_cupones), el cierre cambia a "Ya lo tenés" → directo al QR.
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
      className="card pressable group relative flex flex-col overflow-hidden"
    >
      {/* ── Cabezal: arte de la marca o color con la oferta gigante ── */}
      <div
        className="relative flex min-h-40 items-center justify-center overflow-hidden px-6 py-8 text-center text-white"
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
        ) : (
          <div>
            <p className="tnum text-[clamp(2.4rem,7vw,3.2rem)] font-black uppercase leading-none tracking-tight">
              {d.ofertaGrande}
            </p>
            {d.ofertaResto ? (
              <p className="label mt-2.5 text-white/85">{d.ofertaResto}</p>
            ) : null}
          </div>
        )}

        {/* Sticker de urgencia estilo logo, dentro de la tarjeta */}
        {d.urgencia?.length ? (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {d.urgencia.map((u) => (
              <span
                key={u.texto}
                className={`-rotate-2 whitespace-nowrap rounded-[5px] border-2 border-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)] ${
                  u.brand ? "bg-brand" : "bg-ink"
                }`}
              >
                {u.texto}
              </span>
            ))}
          </div>
        ) : null}

        {/* micro-firma de imprenta */}
        <span
          aria-hidden
          className="label absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-white/45"
          style={{ writingMode: "vertical-rl" }}
        >
          SEVIVELA
        </span>
      </div>

      {/* ── Perforación horizontal con muescas troqueladas ── */}
      <div aria-hidden className="relative h-0 border-t border-dashed border-rule">
        <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-paper" />
        <span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-paper" />
      </div>

      {/* ── Cuerpo del ticket ── */}
      <div className="flex flex-1 flex-col px-5 py-4">
        <p className="label text-faint">
          {d.marca}
          {d.patrocinado ? " · Patrocinado" : ""}
        </p>
        <h3 className="mt-1.5 text-lg font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
          {d.titulo}
        </h3>

        {/* Con arte arriba, la oferta baja al cuerpo como chip de color */}
        {d.img ? (
          <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className="tnum inline-block rounded-[5px] px-2 py-0.5 text-sm font-black uppercase tracking-tight text-white"
              style={{ background: d.agotado ? "#8a8494" : d.color }}
            >
              {d.ofertaGrande}
            </span>
            {d.ofertaResto ? (
              <span className="label text-muted">{d.ofertaResto}</span>
            ) : null}
          </p>
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

        <p className="label mt-auto flex items-center gap-1.5 pt-4 text-brand">
          {yaLoTiene ? "Ya lo tenés · Ver mi cupón" : d.agotado ? "Ver detalle" : "Ver beneficio"}
          <ArrowRightIcon
            width={14}
            height={14}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </p>
      </div>
    </Link>
  );
}
