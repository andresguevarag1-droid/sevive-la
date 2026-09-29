"use client";

/**
 * Panel de participantes de una campaña — para hacer el sorteo a mano.
 * Misma clave maestra que los otros paneles (guardada en el dispositivo).
 * A diferencia del tablero de datos, ACÁ SÍ hay PII: nombre, correo,
 * teléfono. Exportable a CSV para trabajar la lista fuera del navegador.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

const CLAVE_ADMIN = "sv_admin_key";

type CampanaResumen = { slug: string; total: number };

type Entrada = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  residence: string;
  is_over_21: boolean;
  has_passport: boolean;
  has_us_visa: boolean;
  eligible: boolean;
  follows_ig: boolean;
  edad: number | null;
  interes_respuesta: string | null;
  referral_code: string | null;
  referred_by: string | null;
  referral_valid: boolean;
  chances: number;
};

function aCsv(entradas: Entrada[]): string {
  const encabezados = [
    "nombre",
    "correo",
    "telefono",
    "provincia",
    "edad",
    "mayor_21",
    "pasaporte",
    "visa_us",
    "elegible",
    "chances",
    "referido_por",
    "fecha",
  ];
  const filas = entradas.map((e) =>
    [
      e.full_name,
      e.email,
      e.phone ?? "",
      e.residence,
      e.edad ?? "",
      e.is_over_21 ? "sí" : "no",
      e.has_passport ? "sí" : "no",
      e.has_us_visa ? "sí" : "no",
      e.eligible ? "sí" : "no",
      e.chances,
      e.referred_by ?? "",
      new Date(e.created_at).toLocaleString("es-CR"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [encabezados.join(","), ...filas].join("\n");
}

export function PanelParticipantes() {
  const [clave, setClave] = useState("");
  const [claveLista, setClaveLista] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campanas, setCampanas] = useState<CampanaResumen[] | null>(null);
  const [campanaElegida, setCampanaElegida] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Entrada[] | null>(null);
  const [soloElegibles, setSoloElegibles] = useState(false);

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

  const cargarCampanas = useCallback(async (k: string) => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/participantes", { headers: { "x-admin-key": k } });
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
        setError(data?.error ?? "No se pudo cargar.");
        return;
      }
      try {
        sessionStorage.setItem(CLAVE_ADMIN, k);
      } catch {
        /* nada */
      }
      setCampanas(data.campanas as CampanaResumen[]);
      setClaveLista(true);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarEntradas = useCallback(
    async (slug: string) => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/participantes?campana=${encodeURIComponent(slug)}`, {
          headers: { "x-admin-key": clave },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? "No se pudo cargar la campaña.");
          return;
        }
        setEntradas(data.entradas as Entrada[]);
        setCampanaElegida(slug);
      } catch {
        setError("Error de conexión. Probá de nuevo.");
      } finally {
        setCargando(false);
      }
    },
    [clave]
  );

  useEffect(() => {
    if (claveLista && clave && !campanas) void cargarCampanas(clave);
  }, [claveLista, clave, campanas, cargarCampanas]);

  const visibles = useMemo(
    () => (entradas ?? []).filter((e) => !soloElegibles || e.eligible),
    [entradas, soloElegibles]
  );

  const descargarCsv = useCallback(() => {
    if (!campanaElegida || !entradas) return;
    const blob = new Blob([aCsv(visibles)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participantes-${campanaElegida}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [campanaElegida, entradas, visibles]);

  if (!claveLista) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (clave.trim()) void cargarCampanas(clave.trim());
        }}
        className="card mx-auto mt-10 max-w-sm px-6 py-8"
      >
        <p className="label text-faint">Panel privado</p>
        <h1 className="mt-2 text-2xl">Participantes</h1>
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

  // Selector de campaña (aún no se eligió ninguna, o se quiere cambiar).
  if (!campanaElegida) {
    return (
      <div className="mx-auto max-w-2xl">
        <header>
          <p className="label text-faint">Panel privado · SeViveLa</p>
          <h1 className="mt-1 text-3xl">Elegí una campaña</h1>
        </header>
        {error ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-brand">
            {error}
          </p>
        ) : null}
        {cargando ? <p className="mt-6 text-muted">Cargando…</p> : null}
        {!cargando && campanas?.length === 0 ? (
          <p className="mt-6 text-muted">Todavía no hay participaciones registradas.</p>
        ) : null}
        <ul className="mt-6 divide-y divide-rule">
          {(campanas ?? []).map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => void cargarEntradas(c.slug)}
                className="pressable flex w-full items-center justify-between py-4 text-left"
              >
                <span className="text-lg font-semibold text-ink">{c.slug}</span>
                <span className="tnum text-sm font-bold text-faint">{c.total} participantes</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="label text-faint">Panel privado · SeViveLa</p>
          <h1 className="mt-1 text-3xl">{campanaElegida}</h1>
          <p className="tnum mt-1 text-sm text-faint">
            {visibles.length} de {entradas?.length ?? 0} participantes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={soloElegibles}
              onChange={(e) => setSoloElegibles(e.target.checked)}
            />
            Solo elegibles
          </label>
          <button
            type="button"
            onClick={descargarCsv}
            className="pressable bg-lilac px-4 py-2 text-sm font-bold uppercase tracking-wide text-ink"
          >
            Descargar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setCampanaElegida(null);
              setEntradas(null);
            }}
            className="text-sm font-semibold text-brand underline"
          >
            Cambiar campaña
          </button>
        </div>
      </header>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-brand">
          {error}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-faint">
              <th className="py-2 pr-3 font-semibold">Nombre</th>
              <th className="py-2 pr-3 font-semibold">Correo</th>
              <th className="py-2 pr-3 font-semibold">Teléfono</th>
              <th className="py-2 pr-3 font-semibold">Provincia</th>
              <th className="py-2 pr-3 font-semibold">Elegible</th>
              <th className="tnum py-2 pr-3 font-semibold">Chances</th>
              <th className="py-2 pr-3 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e) => (
              <tr key={e.id} className="border-b border-rule/60">
                <td className="py-2 pr-3 text-ink">{e.full_name}</td>
                <td className="py-2 pr-3 text-muted">{e.email}</td>
                <td className="py-2 pr-3 text-muted">{e.phone ?? "—"}</td>
                <td className="py-2 pr-3 text-muted">{e.residence}</td>
                <td className="py-2 pr-3">
                  {e.eligible ? (
                    <span className="font-semibold text-ink">Sí</span>
                  ) : (
                    <span className="text-faint">No</span>
                  )}
                </td>
                <td className="tnum py-2 pr-3 text-ink">{e.chances}</td>
                <td className="py-2 pr-3 text-faint">
                  {new Date(e.created_at).toLocaleDateString("es-CR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
