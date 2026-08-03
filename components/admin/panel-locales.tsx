"use client";

/**
 * Panel de locales de canje (herramienta interna del dueño, mobile-first).
 * La clave maestra se guarda en el dispositivo tras el primer uso y viaja
 * en cada request (header x-admin-key). El servidor es quien manda.
 */
import { useCallback, useEffect, useState } from "react";

const CLAVE_ADMIN = "sv_admin_key";

type Venue = {
  slug: string;
  name: string;
  benefit_slugs: string[] | null;
  created_at: string;
};
type BeneficioOpcion = { slug: string; title: string; marca?: string; vigencia?: string };
type Stat = {
  benefit_slug: string;
  emitidos: number;
  canjeados: number;
  tasa_redencion: number | null;
};
type Datos = {
  emailActivo: boolean;
  venues: Venue[];
  beneficios: BeneficioOpcion[];
  stats: Stat[];
};

type PinNuevo = {
  titulo: string;
  nombre: string;
  pin: string;
  correoEnviado: boolean;
  correoMotivo?: string;
};

export function PanelLocales() {
  const [clave, setClave] = useState("");
  const [claveLista, setClaveLista] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<Datos | null>(null);

  // Alta de local
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [marcados, setMarcados] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);
  const [pinNuevo, setPinNuevo] = useState<PinNuevo | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [regenerando, setRegenerando] = useState<string | null>(null);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(CLAVE_ADMIN);
      if (guardada) {
        setClave(guardada);
        setClaveLista(true);
      }
    } catch {
      /* sin memoria local */
    }
  }, []);

  const cargar = useCallback(
    async (k: string) => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/locales", {
          headers: { "x-admin-key": k },
        });
        const data = await res.json().catch(() => null);
        if (res.status === 401) {
          try {
            localStorage.removeItem(CLAVE_ADMIN);
          } catch {
            /* nada */
          }
          setClaveLista(false);
          setError("Clave incorrecta.");
          return;
        }
        if (!res.ok || !data?.ok) {
          setError(data?.error ?? "No se pudo cargar el panel.");
          return;
        }
        try {
          localStorage.setItem(CLAVE_ADMIN, k);
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
    },
    []
  );

  useEffect(() => {
    if (claveLista && clave && !datos) void cargar(clave);
  }, [claveLista, clave, datos, cargar]);

  async function crearLocal(e: React.FormEvent) {
    e.preventDefault();
    if (creando) return;
    setCreando(true);
    setError(null);
    setPinNuevo(null);
    setCopiado(false);
    try {
      const res = await fetch("/api/admin/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": clave },
        body: JSON.stringify({ name: nombre, email: correo, benefitSlugs: marcados }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "No se pudo crear el local.");
        return;
      }
      setPinNuevo({
        titulo: "Local creado",
        nombre,
        pin: data.pin as string,
        correoEnviado: Boolean(data.correoEnviado),
        correoMotivo: data.correoMotivo as string | undefined,
      });
      setNombre("");
      setCorreo("");
      setMarcados([]);
      setDatos(null); // recargar la lista
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setCreando(false);
    }
  }

  async function regenerarPin(v: Venue) {
    if (regenerando) return;
    const seguro = window.confirm(
      `¿Generar un PIN nuevo para "${v.name}"? El PIN actual deja de servir al instante.`
    );
    if (!seguro) return;
    const email = window.prompt(
      "¿A qué correo se lo enviamos? (dejalo vacío para solo verlo en pantalla)",
      ""
    );
    setRegenerando(v.slug);
    setError(null);
    setPinNuevo(null);
    setCopiado(false);
    try {
      const res = await fetch("/api/admin/locales/regenerar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": clave },
        body: JSON.stringify({ slug: v.slug, email: email ?? "" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "No se pudo regenerar el PIN.");
        return;
      }
      setPinNuevo({
        titulo: "PIN regenerado",
        nombre: v.name,
        pin: data.pin as string,
        correoEnviado: Boolean(data.correoEnviado),
        correoMotivo: data.correoMotivo as string | undefined,
      });
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setRegenerando(null);
    }
  }

  async function copiarPin(pin: string) {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* el PIN queda visible para copiarlo a mano */
    }
  }

  function toggleBeneficio(slug: string) {
    setMarcados((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  /* ── Login ── */
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
        <h1 className="mt-2 text-2xl">Locales de canje</h1>
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

  const statsPorSlug = new Map((datos?.stats ?? []).map((s) => [s.benefit_slug, s]));

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="label text-faint">Panel privado · SeViveLa</p>
          <h1 className="mt-1 text-3xl">Locales de canje</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(CLAVE_ADMIN);
            } catch {
              /* nada */
            }
            setClave("");
            setDatos(null);
            setClaveLista(false);
          }}
          className="text-sm text-muted underline"
        >
          Salir
        </button>
      </header>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-brand">
          {error}
        </p>
      ) : null}

      {/* ── PIN recién generado (se muestra UNA vez) ── */}
      {pinNuevo ? (
        <div className="card mt-6 px-6 py-6" style={{ background: "#e8f7ee" }}>
          <p className="label text-faint">{pinNuevo.titulo}</p>
          <h2 className="mt-1 text-xl text-ink">{pinNuevo.nombre}</h2>
          <p className="tnum mt-3 border border-dashed border-ink/30 bg-white px-4 py-3 text-center text-xl font-extrabold tracking-widest text-ink">
            {pinNuevo.pin}
          </p>
          <button
            type="button"
            onClick={() => void copiarPin(pinNuevo.pin)}
            className="pressable mt-3 w-full border-2 border-ink px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink"
          >
            {copiado ? "¡Copiado!" : "Copiar PIN"}
          </button>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {pinNuevo.correoEnviado
              ? "El PIN también se envió al correo del local."
              : pinNuevo.correoMotivo === "resend_inactivo"
                ? "El envío por correo se activará cuando Resend esté configurado — por ahora copialo y pasáselo al local."
                : pinNuevo.correoMotivo === "fallo_envio"
                  ? "El correo no salió (error del envío) — copialo y pasáselo al local."
                  : "Guardalo ahora: por seguridad no se puede volver a ver, solo regenerar."}
          </p>
        </div>
      ) : null}

      {/* ── Crear local ── */}
      <form onSubmit={crearLocal} className="card mt-6 px-6 py-7">
        <h2 className="text-xl">Nuevo local</h2>
        <label className="mt-5 block">
          <span className="label text-faint">Nombre del local *</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="La Ventana — Escalante"
            required
            minLength={2}
            maxLength={80}
            className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-base text-ink outline-none placeholder:text-faint focus:border-ink"
          />
        </label>
        <label className="mt-5 block">
          <span className="label text-faint">Correo del local (para enviarle el PIN)</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="caja@laventana.cr"
            className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-base text-ink outline-none placeholder:text-faint focus:border-ink"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="label text-faint">
            Beneficios que puede canjear (ninguno marcado = todos)
          </legend>
          {datos && datos.beneficios.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              No hay beneficios con cupón medible en el Studio todavía.
            </p>
          ) : null}
          <div className="mt-2 grid gap-2">
            {(datos?.beneficios ?? []).map((b) => (
              <label key={b.slug} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={marcados.includes(b.slug)}
                  onChange={() => toggleBeneficio(b.slug)}
                  className="h-5 w-5 accent-[var(--color-brand)]"
                />
                <span className="text-sm text-ink">
                  {b.title}
                  {b.marca ? <span className="text-muted"> — {b.marca}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={creando || nombre.trim().length < 2}
          className="pressable mt-7 min-h-12 w-full bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-brand-ink disabled:opacity-50"
        >
          {creando ? "Creando…" : "Crear local y generar PIN"}
        </button>
      </form>

      {/* ── Locales existentes ── */}
      <section className="mt-8">
        <h2 className="text-xl">Locales activos</h2>
        {cargando && !datos ? <p className="mt-3 text-sm text-muted">Cargando…</p> : null}
        {datos && datos.venues.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Todavía no hay locales. Creá el primero arriba.</p>
        ) : null}
        <div className="mt-3 grid gap-3">
          {(datos?.venues ?? []).map((v) => (
            <div key={v.slug} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{v.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {v.benefit_slugs?.length
                      ? `Canjea: ${v.benefit_slugs.join(", ")}`
                      : "Canjea todos los beneficios"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void regenerarPin(v)}
                  disabled={regenerando === v.slug}
                  className="shrink-0 text-sm font-semibold text-brand underline disabled:opacity-50"
                >
                  {regenerando === v.slug ? "Generando…" : "Nuevo PIN"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Métricas por beneficio ── */}
      <section className="mt-8">
        <h2 className="text-xl">Cupones por beneficio</h2>
        <p className="mt-1 text-sm text-muted">
          Emitidos, canjeados y tasa de redención — el dato para las marcas.
        </p>
        {datos && datos.stats.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aún no se ha emitido ningún cupón.</p>
        ) : null}
        <div className="mt-3 grid gap-3">
          {(datos?.beneficios ?? [])
            .filter((b) => statsPorSlug.has(b.slug))
            .map((b) => {
              const s = statsPorSlug.get(b.slug)!;
              return (
                <div key={b.slug} className="card px-5 py-4">
                  <p className="font-bold text-ink">
                    {b.title}
                    {b.marca ? <span className="font-normal text-muted"> — {b.marca}</span> : null}
                  </p>
                  <p className="tnum mt-2 text-sm text-muted">
                    <strong className="text-ink">{s.emitidos}</strong> emitidos ·{" "}
                    <strong className="text-ink">{s.canjeados}</strong> canjeados ·{" "}
                    <strong className="text-ink">{s.tasa_redencion ?? 0}%</strong> de redención
                  </p>
                </div>
              );
            })}
          {/* stats de beneficios que ya no están en Sanity (histórico) */}
          {(datos?.stats ?? [])
            .filter((s) => !(datos?.beneficios ?? []).some((b) => b.slug === s.benefit_slug))
            .map((s) => (
              <div key={s.benefit_slug} className="card px-5 py-4">
                <p className="font-bold text-ink">{s.benefit_slug}</p>
                <p className="tnum mt-2 text-sm text-muted">
                  <strong className="text-ink">{s.emitidos}</strong> emitidos ·{" "}
                  <strong className="text-ink">{s.canjeados}</strong> canjeados ·{" "}
                  <strong className="text-ink">{s.tasa_redencion ?? 0}%</strong> de redención
                </p>
              </div>
            ))}
        </div>
      </section>

      {datos && !datos.emailActivo ? (
        <p className="label mt-8 text-center text-faint">
          Envío de PIN por correo: pendiente de activar Resend.
        </p>
      ) : null}
    </div>
  );
}
