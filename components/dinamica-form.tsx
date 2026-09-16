"use client";

import Link from "next/link";
/**
 * Formulario de participación en una dinámica (captura de lead cualificado).
 * Consentimiento NO premarcado; el texto mostrado es EXACTAMENTE el que
 * registra el servidor. Estados: idle → sending → ok | error.
 */
import { useRef, useState, type FormEvent } from "react";
import { consentDinamica } from "@/lib/consent";
import { isValidEmail, isValidPhone } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { ConsentText } from "@/components/consent-text";
import { track } from "@/lib/analytics/track";
import { utmEnvio } from "@/lib/analytics/utm-client";

type Status = "idle" | "sending" | "ok" | "error";
type ErrorCampo = { campo: string; mensaje: string };

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
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const [repetido, setRepetido] = useState(false);
  const resumenRef = useRef<HTMLDivElement>(null);

  const consentDef = consentDinamica(slug);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    // Validación ligera en cliente; el servidor re-valida con Zod (fuente de
    // verdad). Se recogen TODOS los errores y se anuncian juntos (A1/A7).
    const honeypot =
      (new FormData(e.currentTarget).get("website") as string) || "";
    const fallas: ErrorCampo[] = [];
    if (firstName.trim().length < 2)
      fallas.push({ campo: "d-nombre", mensaje: "Contanos tu nombre." });
    if (!isValidEmail(email))
      fallas.push({ campo: "d-email", mensaje: "Escribí un correo válido." });
    if (!isValidPhone(phone))
      fallas.push({ campo: "d-telefono", mensaje: "Escribí un teléfono válido." });
    if (!consent)
      fallas.push({
        campo: "d-consent",
        mensaje: "Necesitamos tu consentimiento para participar.",
      });

    setErrores(fallas);
    if (fallas.length > 0) {
      setStatus("error");
      requestAnimationFrame(() => resumenRef.current?.focus());
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/dinamica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          answer: answer.trim(),
          consent: true,
          turnstileToken,
          website: honeypot,
          utm: utmEnvio(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; yaParticipaba?: boolean }
        | null;
      if (res.ok && data?.ok) {
        setRepetido(Boolean(data.yaParticipaba));
        track("dynamic_entry_submit_success", { dynamic_slug: slug });
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
        <p className="label text-brand">
          {repetido ? "Ya estabas participando" : "Participación registrada"}
        </p>
        <h3 className="mx-auto mt-3 max-w-md text-2xl">
          {repetido
            ? "Tu participación ya estaba registrada."
            : "¡Estás dentro! Mucha suerte."}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Si resultás ganador(a), te contactamos al correo que nos dejaste.
          Revisá las bases para fechas y condiciones.
        </p>
        <Link
          href="/agenda"
          className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Mientras tanto, mirá la agenda
        </Link>
      </div>
    );
  }

  // ¿Este campo está en la lista de errores? (para aria-invalid)
  const inv = (id: string) => (errores.some((f) => f.campo === id) ? true : undefined);
  const desc = (id: string) => (inv(id) ? `${id}-msg` : undefined);

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="card px-6 py-8 md:px-10 md:py-10"
    >
      <p className="label text-brand">Participá gratis</p>
      <h3 className="mt-2 text-2xl">Dejá tus datos y listo.</h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label>
          <span className="label text-faint">Nombre *</span>
          <input
            id="d-nombre"
            type="text"
            name="firstName"
            aria-invalid={inv("d-nombre")}
            aria-describedby={desc("d-nombre")}
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
            id="d-email"
            type="email"
            name="email"
            aria-invalid={inv("d-email")}
            aria-describedby={desc("d-email")}
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
            id="d-telefono"
            type="tel"
            name="phone"
            aria-invalid={inv("d-telefono")}
            aria-describedby={desc("d-telefono")}
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
          id="d-consent"
          type="checkbox"
          aria-invalid={inv("d-consent")}
          aria-describedby={desc("d-consent")}
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "sending"}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          <ConsentText text={consentDef.text} basesHref={`/legal/bases/${slug}`} />
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
        className="pressable mt-6 min-h-12 w-full bg-brand px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" ? "Enviando…" : "Participar gratis"}
      </button>
      <p className="label mt-3 text-center text-faint">
        Sin costo · Una participación por persona
      </p>
    </form>
  );
}
