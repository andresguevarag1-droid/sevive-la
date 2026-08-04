"use client";

/**
 * Cuenta regresiva con la estética del logo: bloques-sticker negros con
 * borde blanco, inclinados en direcciones alternas sobre la banda lila de
 * marca (como "SE / VIVE / LA!"). Días · horas · min en vivo (tick cada
 * 30 s — no hay segundos, no hace falta más). En el último día aparece el
 * sticker magenta "¡ÚLTIMO DÍA!" (magenta = acción/urgencia).
 */
import { useEffect, useState } from "react";

type Restante = { dias: number; horas: number; min: number };

function calc(cierre: string): Restante | null {
  const ms = new Date(cierre).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    min: Math.floor((s % 3600) / 60),
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
    const id = setInterval(() => setR(calc(cierre)), 30000);
    return () => clearInterval(id);
  }, [cierre]);

  const ultimoDia = r !== null && r.dias === 0;
  const bloques: { valor: string; unidad: string; giro: string }[] = [
    { valor: r ? String(r.dias) : "–", unidad: "días", giro: "-rotate-3" },
    { valor: r ? dos(r.horas) : "–", unidad: "hrs", giro: "rotate-2" },
    { valor: r ? dos(r.min) : "–", unidad: "min", giro: "-rotate-2" },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] bg-lilac shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-5 md:px-7">
        <div className="min-w-0">
          <p className="label text-ink/60">La cuenta corre</p>
          <p className="label tnum mt-1 text-ink">{etiqueta}</p>
          {ultimoDia ? (
            <span className="mt-2.5 inline-block -rotate-2 rounded-[6px] border-[3px] border-white bg-brand px-3 py-1 text-sm font-black uppercase tracking-wide text-white shadow-[0_8px_18px_-6px_rgba(0,0,0,0.45)]">
              ¡Último día!
            </span>
          ) : null}
        </div>

        {/* Los stickers del logo, pero contando. */}
        <div className="flex items-center gap-2.5" role="timer" aria-label={r ? `Quedan ${r.dias} días, ${r.horas} horas y ${r.min} minutos` : "Calculando tiempo restante"}>
          {bloques.map((b) => (
            <div
              key={b.unidad}
              aria-hidden
              className={`${b.giro} flex min-w-[68px] flex-col items-center rounded-[6px] border-[3px] border-white bg-ink px-3 py-2 shadow-[0_10px_22px_-8px_rgba(0,0,0,0.5)]`}
            >
              <span className="tnum text-[1.65rem] font-black leading-none text-white">
                {b.valor}
              </span>
              <span className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                {b.unidad}
                {b.unidad === "min" ? <span className="text-brand">!</span> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
