"use client";

/**
 * Captura contextual al pie de la agenda: quien llegó hasta aquí está
 * planificando — el momento perfecto para ofrecerle la agenda por correo.
 * Mismo flujo que el boletín (consentimiento Ley 8968, honeypot, Turnstile).
 */
import { ConsentText } from "@/components/consent-text";
import { utmEnvio } from "@/lib/analytics/utm-client";
import { useState, type FormEvent } from "react";
import { CONSENT_NEWSLETTER } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { track } from "@/lib/analytics/track";

type Status = "idle" | "sending" | "ok" | "error";

export function BoletinAgenda() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [porConfirmar, setPorConfirmar] = useState(false);
  const [empezado, setEmpezado] = useState(false);

  const marcarInicio = () => {
    if (empezado) return;
    setEmpezado(true);
    track("form_start", { form: "boletin_agenda" });
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    const honeypot = (new FormData(e.currentTarget).get("website") as string) || "";
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Escribí un correo válido.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setError("Necesitamos tu consentimiento para suscribirte.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          consent: true,
          turnstileToken,
          website: honeypot,
          utm: utmEnvio(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; confirmar?: boolean }
        | null;
      if (res.ok && data?.ok) {
        setPorConfirmar(Boolean(data.confirmar));
        track("newsletter_subscribe", { origen: "agenda" });
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos completar tu alta. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  return (
    <div className="card mt-14 px-5 py-6 md:px-8">
      <p className="label text-faint">La agenda, en tu correo</p>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-ink md:text-2xl">
        Estos planes, cada jueves. Sin abrir la app.
      </h2>

      {status === "ok" ? (
        <p aria-live="polite" className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          {porConfirmar
            ? "Un paso más: revisá tu correo y confirmá tu suscripción."
            : "¡Listo! El próximo jueves te llega la agenda de la semana."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4" aria-busy={status === "sending"}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="label text-faint">Correo</span>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={marcarInicio}
                placeholder="tu@correo.com"
                autoComplete="email"
                disabled={status === "sending"}
                className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="pressable min-h-11 shrink-0 bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              {status === "sending" ? "Enviando…" : "Suscribirme"}
            </button>
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

          <label className="mt-4 flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === "sending"}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <span>
              <ConsentText text={CONSENT_NEWSLETTER.text} />
            </span>
          </label>

          <TurnstileWidget onToken={setTurnstileToken} />

          {status === "error" && error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-error">
              ⚠ {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
