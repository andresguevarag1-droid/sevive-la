"use client";

/**
 * Formulario B2B de "Para marcas": deja de ser un mailto y guarda cada
 * consulta comercial en brand_leads (pipeline de ventas medible, con
 * atribución de origen). Estados: idle → sending → ok | error.
 */
import { useRef, useState, type FormEvent } from "react";
import { CONSENT_MARCAS } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { ConsentText } from "@/components/consent-text";
import { track } from "@/lib/analytics/track";
import { utmEnvio } from "@/lib/analytics/utm-client";

type Status = "idle" | "sending" | "ok" | "error";
type ErrorCampo = { campo: string; mensaje: string };

const FORMATOS: { valor: string; etiqueta: string }[] = [
  { valor: "dinamica", etiqueta: "Dinámica / giveaway" },
  { valor: "patrocinado", etiqueta: "Contenido patrocinado" },
  { valor: "cuponera", etiqueta: "Cuponera" },
  { valor: "boletin", etiqueta: "Boletín" },
  { valor: "otro", etiqueta: "Otro / no sé aún" },
];

export function FormMarcas() {
  const [marca, setMarca] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [interes, setInteres] = useState<string>("");
  const [mensaje, setMensaje] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const resumenRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    const honeypot = (new FormData(e.currentTarget).get("website") as string) || "";
    const fallas: ErrorCampo[] = [];
    if (marca.trim().length < 2)
      fallas.push({ campo: "m-marca", mensaje: "Contanos el nombre de tu marca." });
    if (nombre.trim().length < 2)
      fallas.push({ campo: "m-nombre", mensaje: "Contanos tu nombre." });
    if (!isValidEmail(email))
      fallas.push({ campo: "m-email", mensaje: "Escribí un correo válido." });
    if (!consent)
      fallas.push({
        campo: "m-consent",
        mensaje: "Necesitamos tu consentimiento para responderte.",
      });

    setErrores(fallas);
    if (fallas.length > 0) {
      setStatus("error");
      requestAnimationFrame(() => resumenRef.current?.focus());
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/marcas/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: marca.trim(),
          contactName: nombre.trim(),
          email: email.trim().toLowerCase(),
          phone: telefono.trim(),
          interest: interes || undefined,
          message: mensaje.trim(),
          consent: true,
          turnstileToken,
          website: honeypot,
          utm: utmEnvio(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (res.ok && data?.ok) {
        track("form_submit_success", { form: "marcas_lead" });
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos enviar tu consulta. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  if (status === "ok") {
    return (
      <div className="card mt-6 px-6 py-8 md:px-8">
        <p className="font-semibold text-ink">¡Recibido! Te escribimos pronto.</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Tu consulta ya está con el equipo comercial. Normalmente respondemos
          en uno o dos días hábiles.
        </p>
      </div>
    );
  }

  const campo =
    "mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60";

  // ¿Este campo está en la lista de errores? (para aria-invalid)
  const inv = (id: string) => (errores.some((f) => f.campo === id) ? true : undefined);
  const desc = (id: string) => (inv(id) ? `${id}-msg` : undefined);

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="card mt-6 px-6 py-8 md:px-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="label text-faint">Marca / empresa *</span>
          <input
            id="m-marca"
            type="text"
            aria-invalid={inv("m-marca")}
            aria-describedby={desc("m-marca")}
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Tu marca"
            autoComplete="organization"
            disabled={status === "sending"}
            required
            className={campo}
          />
        </label>
        <label>
          <span className="label text-faint">Tu nombre *</span>
          <input
            id="m-nombre"
            type="text"
            aria-invalid={inv("m-nombre")}
            aria-describedby={desc("m-nombre")}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            autoComplete="name"
            disabled={status === "sending"}
            required
            className={campo}
          />
        </label>
        <label>
          <span className="label text-faint">Correo *</span>
          <input
            id="m-email"
            type="email"
            aria-invalid={inv("m-email")}
            aria-describedby={desc("m-email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            autoComplete="email"
            inputMode="email"
            disabled={status === "sending"}
            required
            className={campo}
          />
        </label>
        <label>
          <span className="label text-faint">Teléfono (opcional)</span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="8888-8888"
            autoComplete="tel"
            inputMode="tel"
            disabled={status === "sending"}
            className={campo}
          />
        </label>
      </div>

      {/* Honeypot anti-bot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <fieldset className="mt-6">
        <legend className="label text-faint">¿Qué formato te interesa?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {FORMATOS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setInteres(interes === f.valor ? "" : f.valor)}
              aria-pressed={interes === f.valor}
              disabled={status === "sending"}
              className={`chip pressable min-h-11 border transition-colors ${
                interes === f.valor
                  ? "border-ink bg-ink text-white"
                  : "border-rule text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="label text-faint">¿Qué querés lograr? (opcional)</span>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Contanos tu objetivo: lanzamiento, tráfico al local, leads…"
          disabled={status === "sending"}
          className={`${campo} resize-y`}
        />
      </label>

      <label className="mt-6 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          id="m-consent"
          type="checkbox"
          aria-invalid={inv("m-consent")}
          aria-describedby={desc("m-consent")}
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "sending"}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          <ConsentText text={CONSENT_MARCAS.text} />
        </span>
      </label>

      <TurnstileWidget onToken={setTurnstileToken} />

      {/* ── Resumen de errores accesible: se anuncia y recibe el foco (A1/A7) ── */}
      {errores.length > 0 ? (
        <div
          ref={resumenRef}
          role="alert"
          tabIndex={-1}
          className="mt-5 border-l-2 border-error bg-paper px-4 py-3 outline-none"
        >
          <p className="text-sm font-bold text-ink">
            Revisá {errores.length === 1 ? "este campo" : "estos campos"}:
          </p>
          <ul className="mt-1.5 space-y-1">
            {errores.map((f) => (
              <li key={f.campo}>
                <a id={`${f.campo}-msg`} href={`#${f.campo}`} className="text-sm text-error underline">
                  {f.mensaje}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {status === "error" && error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-error">
          ⚠ {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="pressable mt-6 min-h-12 w-full bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status === "sending" ? "Enviando…" : "Quiero una propuesta"}
      </button>
    </form>
  );
}
