"use client";

/**
 * Tablero de datos de primera mano (D5) — herramienta interna del dueño.
 * Sin PII: solo agregados. Misma clave maestra que el panel de locales
 * (guardada en el dispositivo). Barras en CSS puro: cero librerías.
 */
import { useCallback, useEffect, useState } from "react";
import { verticalColor } from "@/lib/content";
import { getVertical, type VerticalSlug } from "@/lib/site";

const CLAVE_ADMIN = "sv_admin_key";

type Datos = {
  participaciones: {
    total: number;
    conReferido: number;
    elegibles: number;
    porDia: { dia: string; total: number }[];
    porCampana: { clave: string; total: number }[];
    fuentes: { clave: string; total: number }[];
  };
  personas: { total: number; activas: number; porConfirmar: number };
  segmentos: { clave: string; total: number }[];
  eventos?: {
    leadsPorEvento: {
      slug: string;
      titulo: string;
      interesados: number;
      guardados: number;
      total: number;
    }[];
    personasConRespaldo: number;
  };
  cupones: {
    porBeneficio: {
      benefit_slug: string;
      emitidos: number;
      canjeados: number;
      tasa_redencion: number | null;
    }[];
    porEstado: { clave: string; total: number }[];
  };
};

function Tile({ titulo, valor, nota }: { titulo: string; valor: number | string; nota?: string }) {
  return (
    <div className="card px-5 py-4">
      <p className="label text-faint">{titulo}</p>
      <p className="tnum mt-1 text-3xl font-extrabold text-ink">{valor}</p>
      {nota ? <p className="label mt-1 text-faint">{nota}</p> : null}
    </div>
  );
}

function Barras({ items, color }: { items: { clave: string; total: number }[]; color?: (k: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="mt-3 space-y-2">
      {items.map((i) => (
        <div key={i.clave} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-muted">{i.clave}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(3, (i.total / max) * 100)}%`,
                background: color?.(i.clave) ?? "var(--color-brand)",
              }}
            />
          </div>
          <span className="tnum w-10 shrink-0 text-right text-sm font-bold text-ink">
            {i.total}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PanelDatos() {
  const [clave, setClave] = useState("");
  const [claveLista, setClaveLista] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<Datos | null>(null);

  useEffect(() => {
    try {
      const guardada = sessionStorage.getItem(CLAVE_ADMIN);
      if (guardada) {
        setClave(guardada);
        setClaveLista(true);
      }
    } catch {
      /* sin memoria local */
    }
  }, []);

  const cargar = useCallback(async (k: string) => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/datos", { headers: { "x-admin-key": k } });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        try {
          sessionStorage.removeItem(CLAVE_ADMIN);
        } catch {
          /* nada */
        }
        setClaveLista(false);
        setError("Clave incorrecta.");
        return;
      }
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "No se pudo cargar el tablero.");
        return;
      }
      try {
        sessionStorage.setItem(CLAVE_ADMIN, k);
      } catch {
        /* nada */
      }
      setDatos(data as Datos);
      setClaveLista(true);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (claveLista && clave && !datos) void cargar(clave);
  }, [claveLista, clave, datos, cargar]);

  if (!claveLista) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (clave.trim()) void cargar(clave.trim());
        }}
        className="card mx-auto mt-10 max-w-sm px-6 py-8"
      >
        <p className="label text-faint">Panel privado</p>
        <h1 className="mt-2 text-2xl">Tablero de datos</h1>
        <label className="mt-6 block">
          <span className="label text-faint">Clave maestra</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="off"
            className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-base text-ink outline-none focus:border-ink"
          />
        </label>
        {error ? <p className="mt-3 text-sm font-semibold text-brand">{error}</p> : null}
        <button
          type="submit"
          disabled={cargando || !clave.trim()}
          className="pressable mt-6 min-h-12 w-full bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-brand-ink disabled:opacity-50"
        >
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    );
  }

  const p = datos?.participaciones;
  const maxDia = Math.max(1, ...(p?.porDia ?? []).map((d) => d.total));

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="label text-faint">Panel privado · SeViveLa</p>
          <h1 className="mt-1 text-3xl">Tablero de datos</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setDatos(null);
            void cargar(clave);
          }}
          disabled={cargando}
          className="text-sm font-semibold text-brand underline disabled:opacity-50"
        >
          {cargando ? "Cargando…" : "Actualizar"}
        </button>
      </header>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-brand">
          {error}
        </p>
      ) : null}

      {datos ? (
        <>
          {/* ── Totales ── */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile titulo="Participaciones" valor={p!.total} nota={`${p!.elegibles} elegibles`} />
            <Tile
              titulo="Vía referido"
              valor={p!.conReferido}
              nota={p!.total ? `${Math.round((p!.conReferido / p!.total) * 100)}% del total` : undefined}
            />
            <Tile titulo="Personas" valor={datos.personas.total} nota={`${datos.personas.activas} activas`} />
            <Tile
              titulo="Por confirmar"
              valor={datos.personas.porConfirmar}
              nota="doble opt-in pendiente"
            />
          </div>

          {/* ── Últimos 14 días ── */}
          <section className="card mt-4 px-5 py-4">
            <p className="label text-faint">Participaciones · últimos 14 días</p>
            <div className="mt-3 flex h-28 items-end gap-1">
              {p!.porDia.map((d) => (
                <div key={d.dia} className="flex flex-1 flex-col items-center gap-1" title={`${d.dia}: ${d.total}`}>
                  <div
                    className="w-full rounded-t bg-brand"
                    style={{
                      height: `${(d.total / maxDia) * 100}%`,
                      minHeight: d.total > 0 ? 4 : 1,
                      opacity: d.total > 0 ? 1 : 0.15,
                    }}
                  />
                  <span className="tnum text-[9px] text-faint">{d.dia.slice(8)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Fuentes y campañas ── */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <section className="card px-5 py-4">
              <p className="label text-faint">De dónde vino la gente (UTM)</p>
              {p!.fuentes.length ? (
                <Barras items={p!.fuentes} />
              ) : (
                <p className="mt-3 text-sm text-muted">Sin datos todavía.</p>
              )}
            </section>
            <section className="card px-5 py-4">
              <p className="label text-faint">Por campaña</p>
              {p!.porCampana.length ? (
                <Barras items={p!.porCampana} />
              ) : (
                <p className="mt-3 text-sm text-muted">Sin datos todavía.</p>
              )}
            </section>
          </div>

          {/* ── Segmentos por interés ── */}
          <section className="card mt-4 px-5 py-4">
            <p className="label text-faint">Segmentos por interés (el activo vendible)</p>
            {datos.segmentos.length ? (
              <Barras
                items={datos.segmentos.map((s) => ({
                  clave: getVertical(s.clave)?.name ?? s.clave,
                  total: s.total,
                }))}
                color={(nombre) => {
                  const v = [...datos.segmentos].find(
                    (s) => (getVertical(s.clave)?.name ?? s.clave) === nombre
                  );
                  return v ? verticalColor(v.clave as VerticalSlug) : "var(--color-brand)";
                }}
              />
            ) : (
              <p className="mt-3 text-sm text-muted">Sin intereses registrados todavía.</p>
            )}
          </section>

          {/* ── Leads por evento: lo que se le enseña al organizador ── */}
          <section className="card mt-4 px-5 py-4">
            <p className="label text-faint">
              Leads por evento
              {datos.eventos?.personasConRespaldo
                ? ` · ${datos.eventos.personasConRespaldo} ${datos.eventos.personasConRespaldo === 1 ? "persona" : "personas"} con agenda respaldada`
                : ""}
            </p>
            {datos.eventos?.leadsPorEvento.length ? (
              <div className="mt-3 space-y-2">
                {datos.eventos.leadsPorEvento.map((e) => (
                  <p key={e.slug} className="tnum text-sm text-muted">
                    <strong className="text-ink">{e.titulo}</strong> ·{" "}
                    {e.interesados} {e.interesados === 1 ? "interesado" : "interesados"} en la
                    próxima · {e.guardados} en agendas ·{" "}
                    <strong className="text-ink">{e.total} total</strong>
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Sin leads por evento todavía (llegan del formulario “avisame de la
                próxima” y de las agendas respaldadas).
              </p>
            )}
          </section>

          {/* ── Cupones ── */}
          <section className="card mt-4 px-5 py-4">
            <p className="label text-faint">Cupones · redención por beneficio</p>
            {datos.cupones.porBeneficio.length ? (
              <div className="mt-3 space-y-2">
                {datos.cupones.porBeneficio.map((c) => (
                  <p key={c.benefit_slug} className="tnum text-sm text-muted">
                    <strong className="text-ink">{c.benefit_slug}</strong> ·{" "}
                    {c.emitidos} emitidos · {c.canjeados} canjeados ·{" "}
                    <strong className="text-ink">{c.tasa_redencion ?? 0}%</strong>
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Aún no se han emitido cupones.</p>
            )}
          </section>
        </>
      ) : cargando ? (
        <p className="mt-8 text-sm text-muted">Cargando…</p>
      ) : null}
    </div>
  );
}
