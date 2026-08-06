"use client";

/**
 * Cuenta regresiva con la estética del logo: bloques-sticker negros con
 * borde blanco, inclinados en direcciones alternas sobre la banda lila de
 * marca (como "SE / VIVE / LA!"). Días · hrs · min · seg en vivo (tick por
 * segundo). En el último día aparece el sticker magenta "¡ÚLTIMO DÍA!"
 * (magenta = acción/urgencia).
 */
import { useEffect, useState } from "react";

type Restante = { dias: number; horas: number; min: number; seg: number };

function calc(cierre: string): Restante | null {
  const ms = new Date(cierre).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
    seg: s % 60,
  };
}

const dos = (n: number) => String(n).padStart(2, "0");

export function CuentaRegresiva({
  cierre,
  etiqueta,
}: {
  /** ISO del cierre. */
  cierre: string;
  /** "Cierra el 1 de noviembre a las 20:00" (ya formateado por el servidor). */
  etiqueta: string;
}) {
  // Se calcula solo en el cliente (evita desfase servidor/navegador).
  const [r, setR] = useState<Restante | null>(null);
  useEffect(() => {
    setR(calc(cierre));
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setR(calc(cierre));
    }, 1000);
    return () => clearInterval(id);
  }, [cierre]);

  const ultimoDia = r !== null && r.dias === 0;
  const bloques: { valor: string; unidad: string; giro: string }[] = [
    { valor: r ? String(r.dias) : "–", unidad: "días", giro: "-rotate-3" },
    { valor: r ? dos(r.horas) : "–", unidad: "hrs", giro: "rotate-2" },
    { valor: r ? dos(r.min) : "–", unidad: "min", giro: "-rotate-1" },
    { valor: r ? dos(r.seg) : "–", unidad: "seg", giro: "rotate-2" },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] bg-lilac shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-7">
        <div className="min-w-0">
          {/* Mini-sticker del logo como kicker, bien visible sobre el lila */}
          <span className="inline-block -rotate-1 rounded-[5px] border-2 border-white bg-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.4)]">
            La cuenta corre
          </span>
          {/* La fecha en serif editorial, protagonista y legible */}
          <p className="headline tnum mt-2.5 text-[clamp(1.15rem,2.6vw,1.5rem)] leading-tight text-ink">
            {etiqueta}
          </p>
          {ultimoDia ? (
            <span className="mt-2.5 inline-block -rotate-2 rounded-[6px] border-[3px] border-white bg-brand px-3 py-1 text-sm font-black uppercase tracking-wide text-white shadow-[0_8px_18px_-6px_rgba(0,0,0,0.45)]">
              ¡Último día!
            </span>
          ) : null}
        </div>

        {/* Los stickers del logo, pero contando. */}
        <div className="flex items-center gap-2 sm:gap-2.5" role="timer" aria-label={r ? `Quedan ${r.dias} días, ${r.horas} horas, ${r.min} minutos y ${r.seg} segundos` : "Calculando tiempo restante"}>
          {bloques.map((b) => (
            <div
              key={b.unidad}
              aria-hidden
              className={`${b.giro} flex min-w-[58px] flex-col items-center rounded-[6px] border-[3px] border-white bg-ink px-2.5 py-2 shadow-[0_10px_22px_-8px_rgba(0,0,0,0.5)] sm:min-w-[66px]`}
            >
              <span className="tnum text-[1.55rem] font-black leading-none text-white sm:text-[1.65rem]">
                {b.valor}
              </span>
              <span className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {b.unidad}
                {b.unidad === "seg" ? <span className="text-brand">!</span> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
