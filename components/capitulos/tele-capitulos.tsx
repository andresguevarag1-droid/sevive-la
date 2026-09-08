"use client";

/**
 * El televisor de los capítulos: el episodio elegido se reproduce dentro
 * de la TeleRetro (misma estética que /en-vivo, para ir familiarizando)
 * y debajo va el "control remoto": la lista de capítulos con miniatura.
 * Solo el capítulo elegido carga iframe — las miniaturas son imágenes
 * livianas del CDN de YouTube.
 */
import { useState } from "react";
import { TeleRetro } from "@/components/en-vivo/tele-retro";
import { track } from "@/lib/analytics/track";
import type { Capitulo } from "@/lib/sanity/capitulos";

function fmtFechaCR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  }).format(d);
  return s;
}

export function TeleCapitulos({ capitulos }: { capitulos: Capitulo[] }) {
  const [actual, setActual] = useState(capitulos[0]);
  // Autoplay solo cuando la persona cambió de capítulo (no al aterrizar).
  const [autoplay, setAutoplay] = useState(false);

  if (!actual) return null;

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <TeleRetro>
          <iframe
            key={actual.youtubeId}
            src={`https://www.youtube-nocookie.com/embed/${actual.youtubeId}?playsinline=1&rel=0${autoplay ? "&autoplay=1" : ""}`}
            title={actual.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </TeleRetro>
      </div>
      <div className="mx-auto mt-4 max-w-4xl">
        <p className="text-lg font-bold leading-snug text-ink">
          {actual.numero ? `Capítulo ${actual.numero} · ` : ""}
          {actual.titulo}
        </p>
        <p className="mt-1 text-sm text-muted">
          {fmtFechaCR(actual.fecha)}
          {actual.descripcion ? ` — ${actual.descripcion}` : ""}
        </p>
      </div>

      {capitulos.length > 1 ? (
        <section className="mt-12">
          <div className="flex items-baseline gap-3 border-b border-ink pb-2">
            <h2 className="label text-ink">Todos los capítulos</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {capitulos.map((c) => {
              const activo = c.id === actual.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => {
                    setActual(c);
                    setAutoplay(true);
                    track("capitulo_play", { capitulo: c.titulo });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group text-left"
                >
                  <span
                    className={`imgzoom relative block overflow-hidden rounded-[var(--radius-md)] border-2 ${
                      activo ? "border-brand" : "border-transparent"
                    }`}
                  >
                    {/* Miniatura del CDN de YouTube: liviana y siempre al día. */}
                    <img
                      src={`https://i.ytimg.com/vi/${c.youtubeId}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    {activo ? (
                      <span className="label absolute bottom-2 left-2 rounded-full bg-brand px-2.5 py-1 text-[10px] text-brand-ink">
                        Viendo
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-snug text-ink transition-colors group-hover:text-brand">
                    {c.numero ? `Cap. ${c.numero} · ` : ""}
                    {c.titulo}
                  </span>
                  <span className="label mt-1 block text-faint">{fmtFechaCR(c.fecha)}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
