"use client";

/**
 * Formulario B2B de "Para marcas": deja de ser un mailto y guarda cada
 * consulta comercial en brand_leads (pipeline de ventas medible, con
 * atribución de origen). Estados: idle → sending → ok | error.
 */
import { useState, type FormEvent } from "react";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { track } from "@/lib/analytics/track";
import { utmEnvio } from "@/lib/analytics/utm-client";

type Status = "idle" | "sending" | "ok" | "error";

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
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    const honeypot = (new FormData(e.currentTarget).get("website") as string) || "";
    if (marca.trim().length < 2) {
      setStatus("error");
      setError("Contanos el nombre de tu marca.");
      return;
    }
    if (nombre.trim().length < 2) {
      setStatus("error");
      setError("Contanos tu nombre.");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Escribí un correo válido.");
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
            type="text"
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
            type="text"
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
            type="email"
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

      <TurnstileWidget onToken={setTurnstileToken} />

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
      <p className="mt-3 text-xs leading-relaxed text-faint">
        Usamos estos datos únicamente para responder tu consulta comercial.
      </p>
    </form>
  );
}
