"use client";

/**
 * "Mi agenda" nivel revista: cabecera editorial con conteo, grupos por
 * cuándo (Hoy / Esta semana / Más adelante / Ya pasaron) con stickers de
 * urgencia "¡Es hoy!" y "Mañana", deshacer al quitar, compartir el plan
 * por WhatsApp, respaldo por correo y sugerencias para guardar ahí mismo.
 * Sin login: la lista vive en el teléfono; el respaldo la liga a un correo.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { VerticalSlug } from "@/lib/site";
import { site } from "@/lib/site";
import {
  getFavoritos,
  quitarFavorito,
  restaurarFavorito,
  toggleFavorito,
  FAVORITOS_EVENT,
  type Favorito,
} from "@/lib/favoritos";
import { CategoryLabel } from "@/components/kicker";
import { RespaldoAgenda } from "@/components/evento/respaldo-agenda";
import { track } from "@/lib/analytics/track";

/** Evento próximo sugerido (viene del servidor, ya ordenado por fecha). */
export type Sugerencia = {
  slug: string;
  title: string;
  inicio: string;
  lugar?: string;
  vertical: VerticalSlug;
  hora?: string;
};

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Costa_Rica",
  })
    .format(d)
    .replace(/\./g, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Día calendario en CR ("2026-08-04") para comparar hoy/mañana. */
function diaCR(t: number | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(t);
}

type Cuando = "hoy" | "manana" | "semana" | "adelante";

function cuando(iso: string): Cuando {
  const d = new Date(iso);
  const dia = diaCR(d);
  if (dia === diaCR(Date.now())) return "hoy";
  if (dia === diaCR(Date.now() + 86400000)) return "manana";
  if (d.getTime() < Date.now() + 7 * 86400000) return "semana";
  return "adelante";
}

/** Mini-sticker estilo logo (urgencia). */
function Sticker({ texto, brand }: { texto: string; brand?: boolean }) {
  return (
    <span
      className={`inline-block -rotate-2 rounded-[4px] border-2 border-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_5px_12px_-5px_rgba(0,0,0,0.4)] ${
        brand ? "bg-brand" : "bg-ink"
      }`}
    >
      {texto}
    </span>
  );
}

export function MiAgendaLista({ sugerencias }: { sugerencias: Sugerencia[] }) {
  const [favoritos, setFavoritos] = useState<Favorito[] | null>(null);
  const [deshacer, setDeshacer] = useState<Favorito | null>(null);

  useEffect(() => {
    const leer = () => setFavoritos(getFavoritos());
    leer();
    window.addEventListener(FAVORITOS_EVENT, leer);
    return () => window.removeEventListener(FAVORITOS_EVENT, leer);
  }, []);

  useEffect(() => {
    if (!deshacer) return;
    const id = setTimeout(() => setDeshacer(null), 6000);
    return () => clearTimeout(id);
  }, [deshacer]);

  if (favoritos === null) return null;

  const corte = Date.now() - 12 * 3600000;
  const proximos = favoritos
    .filter((f) => new Date(f.inicio).getTime() >= corte)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pasados = favoritos
    .filter((f) => new Date(f.inicio).getTime() < corte)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const slugsGuardados = new Set(favoritos.map((f) => f.slug));
  const verticalesGuardadas = new Set(favoritos.map((f) => f.vertical));
  // Sugerencias: sin lo ya guardado, priorizando las verticales de la persona.
  const paraSugerir = sugerencias
    .filter((s) => !slugsGuardados.has(s.slug))
    .sort(
      (a, b) =>
        (verticalesGuardadas.has(b.vertical) ? 1 : 0) -
        (verticalesGuardadas.has(a.vertical) ? 1 : 0)
    )
    .slice(0, 4);

  const quitar = (f: Favorito) => {
    quitarFavorito(f.slug);
    setDeshacer(f);
    track("favorite_remove", { event_slug: f.slug });
  };

  const guardarSugerencia = (s: Sugerencia) => {
    toggleFavorito({
      slug: s.slug,
      title: s.title,
      inicio: s.inicio,
      lugar: s.lugar,
      vertical: s.vertical,
    });
    track("favorite_add", { event_slug: s.slug });
  };

  /* ── Compartir el plan por WhatsApp (A4): tráfico nuevo con UTM ── */
  const compartirPlan = () => {
    track("share_click", { metodo: "whatsapp", path: "/mi-agenda" });
    const lineas = proximos
      .slice(0, 5)
      .map((f) => `• ${fmt(f.inicio)} — ${f.title}${f.lugar ? ` (${f.lugar})` : ""}`);
    const msj = [
      "Mis próximos planes, vía SeViveLa 🗓️",
      ...lineas,
      "",
      `Armá la tuya: ${site.url}/agenda?utm_source=whatsapp&utm_medium=share&utm_campaign=mi_agenda`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msj)}`, "_blank", "noopener");
  };

  const Fila = ({ f, pasado }: { f: Favorito; pasado?: boolean }) => {
    const c = pasado ? null : cuando(f.inicio);
    const esHoy = c === "hoy";
    return (
      <li
        className={`flex items-baseline gap-4 border-b border-rule py-4 ${
          esHoy ? "-mx-3 rounded-[var(--radius-md)] border-b-0 bg-lilac/15 px-3" : ""
        }`}
      >
        <div className={`min-w-0 flex-1 ${pasado ? "opacity-50" : ""}`}>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <CategoryLabel vertical={f.vertical} />
            {esHoy ? <Sticker texto="¡Es hoy!" brand /> : null}
            {c === "manana" ? <Sticker texto="Mañana" /> : null}
          </div>
          <Link href={`/agenda/${f.slug}`} className="group block">
            <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
              {f.title}
            </h3>
          </Link>
          <p className="tnum mt-1 text-sm text-muted">
            <time dateTime={f.inicio}>{fmt(f.inicio)}</time>
            {f.lugar ? ` · ${f.lugar}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => quitar(f)}
          className="label shrink-0 text-faint underline hover:text-ink"
        >
          Quitar
        </button>
      </li>
    );
  };

  const Grupo = ({ titulo, items }: { titulo: string; items: Favorito[] }) =>
    items.length > 0 ? (
      <section className="mt-8 first:mt-0">
        <h2 className="label border-b border-ink pb-2 text-ink">{titulo}</h2>
        <ul>
          {items.map((f) => (
            <Fila key={f.slug} f={f} />
          ))}
        </ul>
      </section>
    ) : null;

  /* ── Sugerencias (B5): tarjetas con guardado inline ── */
  const Sugerencias = ({ titulo }: { titulo: string }) =>
    paraSugerir.length > 0 ? (
      <section className="mt-10">
        <h2 className="label border-b border-ink pb-2 text-ink">{titulo}</h2>
        <ul>
          {paraSugerir.map((s) => (
            <li key={s.slug} className="flex items-baseline gap-4 border-b border-rule py-4">
              <div className="min-w-0 flex-1">
                <CategoryLabel vertical={s.vertical} className="mb-1.5" />
                <Link href={`/agenda/${s.slug}`} className="group block">
                  <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
                    {s.title}
                  </h3>
                </Link>
                <p className="tnum mt-1 text-sm text-muted">
                  <time dateTime={s.inicio}>{fmt(s.inicio)}</time>
                  {s.lugar ? ` · ${s.lugar}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => guardarSugerencia(s)}
                className="label flex shrink-0 items-center gap-1.5 text-brand"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                Guardar
              </button>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  /* ── Vacía: stickers del logo + sugerencias para arrancar (C10 + B5) ── */
  if (favoritos.length === 0) {
    return (
      <div className="mt-4">
        <div className="py-10 text-center md:py-14">
          <div aria-hidden className="mb-7 flex items-center justify-center gap-2">
            {[
              { t: "Guardá", g: "-rotate-3" },
              { t: "tus", g: "rotate-2" },
              { t: "planes!", g: "-rotate-2" },
            ].map((s) => (
              <span
                key={s.t}
                className={`${s.g} inline-block rounded-[6px] border-[3px] border-white bg-ink px-3.5 py-1.5 text-base font-black uppercase tracking-wide text-white shadow-[0_10px_22px_-8px_rgba(0,0,0,0.45)]`}
              >
                {s.t === "planes!" ? (
                  <>
                    planes<span className="text-brand">!</span>
                  </>
                ) : (
                  s.t
                )}
              </span>
            ))}
          </div>
          <h2 className="mx-auto max-w-lg text-2xl">
            Todavía no guardaste nada — eso se arregla ya.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Tocá el corazón en cualquier evento (o aquí abajo) y queda en tu
            agenda, en tu teléfono.
          </p>
        </div>
        <Sugerencias titulo="Esta semana, para arrancar" />
        <div className="mt-8 text-center">
          <Link
            href="/agenda"
            className="pressable inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Explorar la agenda
          </Link>
        </div>
      </div>
    );
  }

  /* ── Cabecera editorial (C9) ── */
  const proximo = proximos[0];
  const cuandoProximo = proximo
    ? cuando(proximo.inicio) === "hoy"
      ? "el próximo es hoy"
      : cuando(proximo.inicio) === "manana"
        ? "el próximo es mañana"
        : `el próximo en ${Math.max(1, Math.ceil((new Date(proximo.inicio).getTime() - Date.now()) / 86400000))} días`
    : null;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <p className="headline text-[clamp(1.3rem,3.4vw,1.8rem)] leading-snug text-ink">
          <span className="tnum">{proximos.length}</span>{" "}
          {proximos.length === 1 ? "plan próximo" : "planes próximos"}
          {cuandoProximo ? <span className="text-muted"> · {cuandoProximo}</span> : null}
        </p>
        {proximos.length > 0 ? (
          <button
            type="button"
            onClick={compartirPlan}
            className="pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-lilac px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(26,21,38,0.45)] transition-[filter] duration-200 hover:brightness-110"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
            </svg>
            Compartir mi plan
          </button>
        ) : null}
      </div>

      {/* ── Grupos por cuándo (B6) con urgencia (A2) ── */}
      {proximos.length > 0 ? (
        <>
          <Grupo titulo="Hoy" items={proximos.filter((f) => cuando(f.inicio) === "hoy")} />
          <Grupo
            titulo="Esta semana"
            items={proximos.filter((f) => ["manana", "semana"].includes(cuando(f.inicio)))}
          />
          <Grupo
            titulo="Más adelante"
            items={proximos.filter((f) => cuando(f.inicio) === "adelante")}
          />
        </>
      ) : (
        <p className="text-sm text-muted">
          No tenés planes próximos guardados.{" "}
          <Link href="/agenda" className="text-brand underline">
            Explorá la agenda
          </Link>
          .
        </p>
      )}

      {/* ── Respaldo por correo (A1) ── */}
      <RespaldoAgenda />

      {/* ── Te podría gustar (B5) ── */}
      <Sugerencias titulo="Te podría gustar" />

      {pasados.length > 0 ? (
        <section className="mt-10">
          <h2 className="label border-b border-ink pb-2 text-faint">Ya pasaron</h2>
          <ul>
            {pasados.map((f) => (
              <Fila key={f.slug} f={f} pasado />
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Deshacer (B7) ── */}
      {deshacer ? (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
          <div
            role="status"
            className="flex items-center gap-4 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]"
          >
            <span className="max-w-[55vw] truncate">Quitado de tu agenda</span>
            <button
              type="button"
              onClick={() => {
                restaurarFavorito(deshacer);
                track("favorite_add", { event_slug: deshacer.slug });
                setDeshacer(null);
              }}
              className="shrink-0 font-bold uppercase tracking-wide text-brand"
            >
              Deshacer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
