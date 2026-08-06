"use client";

/**
 * Formulario de interés en un evento que YA PASÓ: "avisame de la próxima
 * edición". Convierte una página muerta en captura de leads segmentados
 * por evento (audiencia monetizable ante el organizador). Consentimiento
 * NO premarcado (Ley 8968); el servidor re-valida y registra todo.
 */
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { consentInteresEvento } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { track } from "@/lib/analytics/track";
import { getAttribution } from "@/lib/analytics/attribution";

type Status = "idle" | "sending" | "ok" | "error";

export function InteresEvento({
  slug,
  titulo,
  variante = "evento",
}: {
  slug: string;
  titulo: string;
  /** "evento": página de evento pasado · "cronica": cierre de cobertura. */
  variante?: "evento" | "cronica";
}) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [empezado, setEmpezado] = useState(false);

  const consentDef = consentInteresEvento(slug);

  function marcarInicio() {
    if (empezado) return;
    setEmpezado(true);
    track("form_start", { form: "interes_evento", event_slug: slug });
  }

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
      setError("Necesitamos tu consentimiento para avisarte.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/interes-evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: slug,
          email: email.trim().toLowerCase(),
          firstName: nombre.trim(),
          consent: true,
          turnstileToken,
          website: honeypot,
          utm: getAttribution(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (res.ok && data?.ok) {
        track("form_submit_success", { form: "interes_evento", event_slug: slug });
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos guardar tu interés. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  return (
    <div className="card mt-6 px-5 py-6 md:px-7">
      <p className="label text-faint">
        {variante === "evento" ? "Este evento ya pasó" : "La próxima edición"}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight leading-snug text-ink">
        {variante === "evento"
          ? "¿Te lo perdiste? Te aviso de la próxima edición."
          : "¿Querés que te avise cuando vuelva?"}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Dejá tu correo y cuando se anuncie la próxima edición de {titulo} —o un
        plan parecido— te llega primero a vos.
      </p>

      <p aria-live="polite" className="sr-only">
        {status === "ok" ? "Registro exitoso: te avisaremos de la próxima edición." : ""}
      </p>
      {status === "ok" ? (
        <div className="mt-5">
          <p className="font-semibold text-ink">¡Listo! Quedaste en la lista.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Apenas haya noticias de la próxima edición, te escribimos.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5" aria-busy={status === "sending"}>
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
            <label className="flex-1">
              <span className="label text-faint">Nombre (opcional)</span>
              <input
                type="text"
                name="firstName"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onFocus={marcarInicio}
                placeholder="¿Cómo te llamamos?"
                autoComplete="given-name"
                maxLength={80}
                disabled={status === "sending"}
                className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
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

          {/* Honeypot anti-bot: invisible para personas, irresistible para bots. */}
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
              {consentDef.text}{" "}
              <Link href="/legal/privacidad" className="underline">
                Política de Privacidad
              </Link>
              .
            </span>
          </label>

          <TurnstileWidget onToken={setTurnstileToken} />

          {status === "error" && error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-ink">
              ⚠ {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
