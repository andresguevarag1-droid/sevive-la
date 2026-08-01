"use client";

/**
 * Formulario de participación en una dinámica (captura de lead cualificado).
 * Consentimiento NO premarcado; el texto mostrado es EXACTAMENTE el que
 * registra el servidor. Estados: idle → sending → ok | error.
 */
import { useState, type FormEvent } from "react";
import { consentDinamica } from "@/lib/consent";
import { dinamicaEntrySchema } from "@/lib/validation/dinamica";
import { TurnstileWidget } from "@/components/turnstile";

type Status = "idle" | "sending" | "ok" | "error";

const inputClass =
  "mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60";

export function DinamicaForm({
  slug,
  pregunta,
}: {
  slug: string;
  pregunta?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answer, setAnswer] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const consentDef = consentDinamica(slug);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    const honeypot =
      (new FormData(e.currentTarget).get("website") as string) || "";
    const parsed = dinamicaEntrySchema.safeParse({
      slug,
      firstName,
      email,
      phone,
      answer,
      consent,
      turnstileToken,
      website: honeypot,
    });
    if (!parsed.success) {
      setStatus("error");
      setError(parsed.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/dinamica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; yaParticipaba?: boolean }
        | null;
      if (res.ok && data?.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos registrar tu participación. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  if (status === "ok") {
    /* ── Confirmación ── */
    return (
      <div
        aria-live="polite"
        className="card px-6 py-10 text-center md:px-10"
      >
        <p className="label text-brand">Participación registrada</p>
        <h3 className="mx-auto mt-3 max-w-md text-2xl">
          ¡Estás dentro! Mucha suerte.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Si resultás ganador(a), te contactamos al correo que nos dejaste.
          Revisá las bases para fechas y condiciones.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="card px-6 py-8 md:px-10 md:py-10"
    >
      <p className="label text-faint">Participá gratis</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label>
          <span className="label text-faint">Nombre *</span>
          <input
            type="text"
            name="firstName"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="given-name"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
        <label>
          <span className="label text-faint">Correo *</span>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="label text-faint">Teléfono (opcional)</span>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+506 8888 8888"
            autoComplete="tel"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
        {pregunta ? (
          <label className="sm:col-span-2">
            <span className="label text-faint">{pregunta}</span>
            <textarea
              name="answer"
              rows={3}
              maxLength={500}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Contanos…"
              disabled={status === "sending"}
              className={`${inputClass} resize-none`}
            />
          </label>
        ) : null}
      </div>

      {/* Honeypot anti-bot: invisible para personas, irresistible para bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <label className="mt-6 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "sending"}
          className="mt-1 h-3.5 w-3.5 shrink-0"
        />
        <span>
          {consentDef.text}{" "}
          <a href="/legal/privacidad" className="underline">
            Política de Privacidad
          </a>{" "}
          ·{" "}
          <a href={`/legal/bases/${slug}`} className="underline">
            Bases de la dinámica
          </a>
          .
        </span>
      </label>

      <TurnstileWidget onToken={setTurnstileToken} />

      {status === "error" && error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-brand">
          ⚠ {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="pressable mt-6 min-h-11 w-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        {status === "sending" ? "Enviando…" : "Participar"}
      </button>
    </form>
  );
}
