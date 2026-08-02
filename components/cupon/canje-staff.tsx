"use client";

/**
 * Pantalla de canje para el STAFF del local (mobile-first, una mano).
 * El PIN del local se guarda en el dispositivo tras el primer uso.
 * El QR del cliente abre esta página con ?code=, así que la cámara nativa
 * del teléfono hace de escáner: aquí solo se confirma el canje.
 */
import { useEffect, useState } from "react";

type Resultado =
  | { tipo: "canjeado"; venue?: string }
  | { tipo: "ya_canjeado"; redeemedAt?: string }
  | { tipo: "vencido" }
  | { tipo: "no_valido" }
  | { tipo: "local_no_autorizado" }
  | { tipo: "error" };

const CLAVE_PIN = "sv_venue_token";

export function CanjeStaff({ codeInicial }: { codeInicial?: string }) {
  const [code, setCode] = useState(codeInicial ?? "");
  const [pin, setPin] = useState("");
  const [pinGuardado, setPinGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_PIN);
      if (guardado) {
        setPin(guardado);
        setPinGuardado(true);
      }
    } catch {
      /* sin memoria local */
    }
  }, []);

  async function canjear() {
    if (enviando) return;
    setResultado(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/beneficio/canjear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), venueToken: pin.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; estado: string; venue?: string; redeemedAt?: string }
        | null;
      if (data?.ok && data.estado === "canjeado") {
        try {
          localStorage.setItem(CLAVE_PIN, pin.trim());
          setPinGuardado(true);
        } catch {
          /* sin memoria local */
        }
        setResultado({ tipo: "canjeado", venue: data.venue });
      } else if (data?.estado === "ya_canjeado") {
        setResultado({ tipo: "ya_canjeado", redeemedAt: data.redeemedAt });
      } else if (data?.estado === "vencido") {
        setResultado({ tipo: "vencido" });
      } else if (data?.estado === "local_no_autorizado") {
        setResultado({ tipo: "local_no_autorizado" });
      } else if (data?.estado === "no_valido") {
        setResultado({ tipo: "no_valido" });
      } else {
        setResultado({ tipo: "error" });
      }
    } catch {
      setResultado({ tipo: "error" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {/* ── Resultado grande y claro ── */}
      {resultado ? (
        <div
          role="status"
          className="card mb-6 px-6 py-8 text-center"
          style={{
            background:
              resultado.tipo === "canjeado"
                ? "#e8f7ee"
                : resultado.tipo === "ya_canjeado"
                  ? "#fff7e0"
                  : "#fdeaea",
          }}
        >
          <p className="text-5xl" aria-hidden>
            {resultado.tipo === "canjeado" ? "✅" : resultado.tipo === "ya_canjeado" ? "⚠️" : "❌"}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-ink">
            {resultado.tipo === "canjeado"
              ? "Válido — canjeado"
              : resultado.tipo === "ya_canjeado"
                ? "Ya fue canjeado"
                : resultado.tipo === "vencido"
                  ? "Cupón vencido"
                  : resultado.tipo === "local_no_autorizado"
                    ? "PIN de local incorrecto"
                    : resultado.tipo === "no_valido"
                      ? "Código no válido"
                      : "Error de conexión"}
          </h2>
          {resultado.tipo === "ya_canjeado" && resultado.redeemedAt ? (
            <p className="tnum mt-2 text-sm text-muted">
              {new Date(resultado.redeemedAt).toLocaleString("es-CR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Costa_Rica",
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="card px-6 py-8">
        <label className="block">
          <span className="label text-faint">Código del cupón</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SV-XXXX-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="tnum mt-2 w-full border-b border-rule bg-transparent pb-2 text-xl font-bold tracking-widest text-ink outline-none placeholder:font-normal placeholder:text-faint focus:border-ink"
          />
        </label>

        <label className="mt-6 block">
          <span className="label text-faint">
            PIN del local {pinGuardado ? "· recordado en este dispositivo" : ""}
          </span>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="El PIN que te dio SeViveLa"
            autoComplete="off"
            className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink"
          />
        </label>

        <button
          type="button"
          onClick={canjear}
          disabled={enviando || !code || !pin}
          className="pressable mt-7 min-h-14 w-full bg-brand px-6 py-4 text-base font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Verificando…" : "Canjear cupón"}
        </button>
        <p className="label mt-3 text-center text-faint">
          El canje es definitivo: un cupón solo se usa una vez.
        </p>
      </div>
    </div>
  );
}
