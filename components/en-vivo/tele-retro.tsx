import type { ReactNode } from "react";

/**
 * Televisor retro en CSS puro (cero imágenes: liviano y nítido en
 * cualquier densidad de pantalla). El "tubo" mantiene 16:9 para alojar
 * la emisión; sin contenido muestra las barras de ajuste clásicas con
 * el rótulo "FUERA DEL AIRE". Todo escala con el ancho del contenedor,
 * así que se ve bien del iPhone SE a un monitor grande.
 * Paleta de la casa: cuerpo lila de marca, bisel morado profundo,
 * perillas de papel. Nada de brillos ni degradados decorativos: las
 * barras son franjas planas y las líneas de escaneo, textura del CRT.
 */

/** Barras de ajuste + rótulo, para el estado fuera del aire. */
function BarrasDeAjuste({ rotulo }: { rotulo: string }) {
  const barras = [
    "#f4f4f0", // blanco
    "#f2c500", // amarillo
    "#20c4c9", // cian
    "#14ad4d", // verde
    "#e93cac", // magenta
    "#e5332a", // rojo
    "#3550c9", // azul
  ];
  const franjas = barras
    .map((c, i) => `${c} ${(i * 100) / barras.length}% ${((i + 1) * 100) / barras.length}%`)
    .join(", ");
  return (
    <div className="absolute inset-0">
      {/* Franjas planas con cortes duros (patrón SMPTE simplificado). */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(90deg, ${franjas})` }}
      />
      {/* Rótulo como en las teles viejas: banda oscura abajo. */}
      <p className="absolute inset-x-0 bottom-0 bg-ink/85 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.14em] text-paper sm:px-5 sm:py-3">
        {rotulo}
      </p>
    </div>
  );
}

export function TeleRetro({
  children,
  rotulo = "Fuera del aire",
}: {
  /** Contenido del tubo (el iframe de la emisión). Sin él: barras de ajuste. */
  children?: ReactNode;
  rotulo?: string;
}) {
  return (
    <div className="w-full">
      {/* ── Antenas ── */}
      <div aria-hidden="true" className="relative mx-auto h-12 w-40 sm:h-16">
        <div className="absolute bottom-0 left-1/2 h-full w-1 origin-bottom -rotate-[28deg] rounded-full bg-ink" />
        <div className="absolute bottom-0 left-1/2 h-full w-1 origin-bottom rotate-[28deg] rounded-full bg-ink" />
        <div className="absolute -bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-md bg-ink" />
      </div>

      {/* ── Caja ── */}
      <div
        className="rounded-[var(--radius-xl)] border-b-8 border-deep/40 bg-lilac p-3 sm:p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* En teléfono el panel de control baja bajo la pantalla: el tubo
            usa TODO el ancho (el video manda). En sm+ vuelve al costado. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
          {/* ── Tubo (pantalla) ── */}
          <div className="min-w-0 flex-1 rounded-[var(--radius-lg)] bg-deep p-2 sm:p-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-md)] bg-ink">
              {children ?? (
                <>
                  <BarrasDeAjuste rotulo={rotulo} />
                  {/* Líneas de escaneo + viñeta: textura del tubo apagado.
                      Solo aquí — la emisión real se ve limpia. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)]"
                    style={{
                      background:
                        "repeating-linear-gradient(0deg, rgba(10,8,16,0.10) 0 1px, transparent 1px 3px)",
                      boxShadow: "inset 0 0 48px rgba(10, 8, 16, 0.38)",
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* ── Panel de control ── */}
          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-3 px-1 sm:w-20 sm:flex-col sm:items-center sm:gap-4 sm:px-0 sm:py-1"
          >
            {/* Perillas: disco de papel con muesca de tinta. */}
            <div className="relative h-9 w-9 rounded-full border-2 border-deep bg-paper sm:h-14 sm:w-14">
              <div className="absolute left-1/2 top-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-ink sm:top-1.5 sm:h-4 sm:w-1" />
            </div>
            <div className="relative h-9 w-9 rotate-45 rounded-full border-2 border-deep bg-paper sm:h-14 sm:w-14">
              <div className="absolute left-1/2 top-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-ink sm:top-1.5 sm:h-4 sm:w-1" />
            </div>
            {/* Parlante: ranuras verticales en teléfono, horizontales al costado. */}
            <div
              className="ml-auto h-9 w-24 rounded-[var(--radius-xs)] sm:hidden"
              style={{
                background:
                  "repeating-linear-gradient(90deg, var(--color-deep) 0 3px, transparent 3px 8px)",
              }}
            />
            <div
              className="hidden sm:mt-auto sm:block sm:h-24 sm:w-12 sm:rounded-[var(--radius-xs)]"
              style={{
                background:
                  "repeating-linear-gradient(0deg, var(--color-deep) 0 3px, transparent 3px 8px)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Patas ── */}
      <div aria-hidden="true" className="mx-auto flex w-3/4 justify-between px-6 sm:px-10">
        <div className="h-6 w-2.5 -skew-x-[16deg] rounded-b-md bg-deep sm:h-8 sm:w-3" />
        <div className="h-6 w-2.5 skew-x-[16deg] rounded-b-md bg-deep sm:h-8 sm:w-3" />
      </div>
    </div>
  );
}
