"use client";

/**
 * Pedir el link mágico de recuperación de "Mi agenda" (otro dispositivo).
 * Respuesta genérica: nunca revela si un correo tiene respaldo o no.
 */
import { useState, type FormEvent } from "react";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { track } from "@/lib/analytics/track";

type Status = "idle" | "sending" | "ok" | "error";

export function RecuperarAgendaForm() {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Escribí un correo válido.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/agenda/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), turnstileToken, website: "" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string }
        | null;
      if (res.ok && data?.ok) {
        track("form_submit_success", { form: "agenda_recuperar_pedido" });
        setStatus("ok");
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos enviar el enlace. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  if (status === "ok") {
    return (
      <p aria-live="polite" className="mt-4 text-sm leading-relaxed text-muted">
        Si ese correo tiene un respaldo, el enlace ya va en camino — revisá tu
        bandeja (y el spam, por si acaso).
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="label mt-4 text-faint underline hover:text-ink"
      >
        ¿Tenías una agenda en otro teléfono? Recuperala por correo
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4" aria-busy={status === "sending"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-left">
          <span className="label text-faint">Correo del respaldo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            disabled={status === "sending"}
            className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="pressable min-h-11 shrink-0 border-2 border-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-wait disabled:opacity-70"
        >
          {status === "sending" ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </div>
      <TurnstileWidget onToken={setTurnstileToken} />
      {status === "error" && error ? (
        <p role="alert" className="mt-3 text-left text-sm font-medium text-ink">
          ⚠ {error}
        </p>
      ) : null}
    </form>
  );
}
