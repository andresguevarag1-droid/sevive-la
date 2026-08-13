"use client";

/**
 * "Avisame cuando empiece" — captura de la página /en-vivo.
 * Alta al boletín con interés declarado "en-vivo" (segmentación: la
 * audiencia de transmisiones es un segmento vendible ante marcas).
 * Mismo contrato que el boletín: consentimiento NO premarcado (Ley 8968),
 * validación repetida en servidor, Turnstile y honeypot.
 */
import { useState, type FormEvent } from "react";
import { ConsentText } from "@/components/consent-text";
import { TurnstileWidget } from "@/components/turnstile";
import { utmEnvio } from "@/lib/analytics/utm-client";
import { track } from "@/lib/analytics/track";
import { CONSENT_NEWSLETTER } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";

type Status = "idle" | "sending" | "ok" | "error";

export function AvisameEnVivo() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [porConfirmar, setPorConfirmar] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    const honeypot =
      (new FormData(e.currentTarget).get("website") as string) || "";
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Escribí un correo válido.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setError("Necesitamos tu consentimiento para avisarte.");
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
          intereses: ["en-vivo"],
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; confirmar?: boolean }
        | null;
      if (res.ok && data?.ok) {
        setPorConfirmar(Boolean(data.confirmar));
        track("envivo_avisame", {});
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos registrarte. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  return (
    <div className="mt-8 max-w-xl">
      <p aria-live="polite" className="sr-only">
        {status === "ok" ? "Registro completado con éxito." : ""}
      </p>
      {status === "ok" ? (
        <div>
          <p className="text-lg font-medium text-ink">
            {porConfirmar ? "Un paso más: revisá tu correo." : "¡Listo! Te avisamos."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {porConfirmar
              ? "Te enviamos un enlace para confirmar. Si no lo ves, revisá la carpeta de spam."
              : "Cuando arranquemos una transmisión, te llega el aviso al correo."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={status === "sending"}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="label text-muted">Correo</span>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                aria-label="Correo electrónico"
                disabled={status === "sending"}
                className="mt-2 w-full border-b border-ink/30 bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="pressable min-h-11 shrink-0 bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
            >
              {status === "sending" ? "Enviando…" : "Avisame"}
            </button>
          </div>

          {/* Honeypot anti-bot: invisible para personas. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <label className="mt-5 flex items-start gap-2.5 text-sm text-muted">
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
