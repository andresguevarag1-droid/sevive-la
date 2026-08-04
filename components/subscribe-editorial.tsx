"use client";

import Link from "next/link";
/**
 * Boletín — bloque de tinta plano (sin orbes ni degradados).
 * Inputs con subrayado editorial. Consentimiento NO premarcado (Ley 8968):
 * el texto que se muestra es EXACTAMENTE el que registra el servidor.
 * Estados: idle → sending → ok | error.
 */
import { track } from "@/lib/analytics/track";
import { useState, type FormEvent } from "react";
import { CONSENT_NEWSLETTER } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";

type Status = "idle" | "sending" | "ok" | "error";

export function SubscribeEditorial() {
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

    // Validación ligera en cliente; el servidor re-valida con Zod (fuente de verdad).
    const honeypot =
      (new FormData(e.currentTarget).get("website") as string) || "";
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
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; confirmar?: boolean }
        | null;
      if (res.ok && data?.ok) {
        setPorConfirmar(Boolean(data.confirmar));
        track("newsletter_subscribe", {});
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
    <section id="boletin" data-reveal className="scroll-mt-20 px-4 pb-14 pt-12 md:pb-16">
      <div className="mx-auto mb-6 max-w-6xl">
        {/* mismo divisor numerado que el resto de la portada (ritmo) */}
        <div className="flex items-baseline gap-3 border-b border-ink pb-2">
          <span className="label tnum text-brand">06</span>
          <h2 className="label text-ink">Boletín</h2>
        </div>
      </div>
      <div
        className="mx-auto max-w-6xl rounded-[var(--radius-xl)] px-6 py-12 text-paper md:px-14 md:py-16"
        style={{ background: "var(--color-deep)" }}
      >
        <div className="max-w-2xl">
          <span className="label text-paper/55">Cada jueves</span>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.05] text-paper">
            Los mejores planes del fin de semana, en tu correo.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-paper/70">
            Eventos, aperturas y beneficios de la semana, curados por la
            redacción. Sin relleno.
          </p>

          {status === "ok" ? (
            /* ── Estado de éxito ── */
            <div aria-live="polite" className="mt-8">
              <p className="text-xl font-medium text-paper">
                {porConfirmar
                  ? "Un paso más: revisá tu correo."
                  : "¡Listo! Ya estás en la lista."}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper/70">
                {porConfirmar
                  ? "Te enviamos un enlace para confirmar tu suscripción. Si no lo ves, revisá la carpeta de spam."
                  : "El próximo jueves te llega el primer boletín. Si no lo ves, revisá la carpeta de spam y marcanos como confiables."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8"
              aria-busy={status === "sending"}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <label className="flex-1">
                  <span className="label text-paper/50">Correo</span>
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
                    className="mt-2 w-full border-b border-paper/30 bg-transparent pb-2 text-paper outline-none placeholder:text-paper/40 focus:border-paper disabled:opacity-60"
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

              {/* Honeypot anti-bot: invisible para personas, irresistible para bots. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <label className="mt-5 flex items-start gap-2.5 text-sm text-paper/65">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={status === "sending"}
                  className="mt-0.5 h-5 w-5 shrink-0"
                />
                <span>
                  {CONSENT_NEWSLETTER.text}{" "}
                  <Link href="/legal/privacidad" className="underline">
                    Política de Privacidad
                  </Link>
                  .
                </span>
              </label>

              <TurnstileWidget onToken={setTurnstileToken} theme="dark" />

              {status === "error" && error ? (
                <p role="alert" className="mt-4 text-sm font-medium text-paper">
                  ⚠ {error}
                </p>
              ) : null}

              <p className="label mt-6 text-paper/40">
                Cero spam · Un correo por semana · Baja cuando quieras
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
