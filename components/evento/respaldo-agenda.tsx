"use client";

/**
 * Respaldo de "Mi agenda" por correo (A1): convierte los guardados anónimos
 * del navegador en un perfil identificado con intereses declarados — y la
 * persona no pierde su agenda si cambia de teléfono. Consentimiento NO
 * premarcado (Ley 8968). El correo respaldado queda en localStorage para
 * ofrecer "Actualizar respaldo" en visitas siguientes.
 */
import { useEffect, useState, type FormEvent } from "react";
import { CONSENT_AGENDA } from "@/lib/consent";
import { getFavoritos } from "@/lib/favoritos";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { RecuperarAgendaForm } from "@/components/evento/recuperar-agenda-form";
import { ConsentText } from "@/components/consent-text";
import { track } from "@/lib/analytics/track";
import { utmEnvio } from "@/lib/analytics/utm-client";

const CLAVE_CORREO = "sv_agenda_correo";

type Status = "idle" | "sending" | "ok" | "error";

async function respaldar(
  email: string,
  turnstileToken: string
): Promise<{ ok: boolean; error?: string; confirmar?: boolean }> {
  const items = getFavoritos().map((f) => ({
    slug: f.slug,
    title: f.title,
    inicio: f.inicio,
    lugar: f.lugar ?? "",
    vertical: f.vertical,
  }));
  const res = await fetch("/api/agenda/respaldar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      consent: true,
      items,
      turnstileToken,
      website: "",
      utm: utmEnvio(),
    }),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok: boolean; error?: string; confirmar?: boolean }
    | null;
  return res.ok && data?.ok
    ? { ok: true, confirmar: data.confirmar }
    : { ok: false, error: data?.error };
}

export function RespaldoAgenda() {
  const [correoGuardado, setCorreoGuardado] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // El respaldo quedó pendiente de confirmar por correo (doble opt-in).
  const [porConfirmar, setPorConfirmar] = useState(false);

  useEffect(() => {
    try {
      setCorreoGuardado(localStorage.getItem(CLAVE_CORREO));
    } catch {
      /* sin memoria local */
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");
    if (!isValidEmail(email)) {
      setStatus("error");
      setError("Escribí un correo válido.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setError("Necesitamos tu consentimiento para respaldar tu agenda.");
      return;
    }
    setStatus("sending");
    const r = await respaldar(email.trim().toLowerCase(), turnstileToken);
    if (r.ok) {
      track("form_submit_success", { form: "agenda_respaldo" });
      try {
        localStorage.setItem(CLAVE_CORREO, email.trim().toLowerCase());
      } catch {
        /* sin memoria local */
      }
      setCorreoGuardado(email.trim().toLowerCase());
      setPorConfirmar(Boolean(r.confirmar));
      setStatus("ok");
    } else {
      setStatus("error");
      setError(r.error ?? "No pudimos respaldar tu agenda. Intentá de nuevo.");
    }
  }

  async function actualizar() {
    if (!correoGuardado || status === "sending") return;
    setError("");
    setStatus("sending");
    const r = await respaldar(correoGuardado, turnstileToken);
    if (r.ok) {
      track("form_submit_success", { form: "agenda_respaldo_update" });
      setStatus("ok");
    } else {
      setStatus("error");
      setError(r.error ?? "No pudimos actualizar el respaldo. Intentá de nuevo.");
    }
  }

  /* ── Ya respaldada: estado compacto con actualización ── */
  if (correoGuardado) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-rule py-4">
        <p className="text-sm text-muted">
          {status === "ok" ? (
            porConfirmar ? (
              <span className="font-semibold text-ink">
                Respaldo guardado ✓ — te enviamos un correo: abrilo y confirmá
                para activar los recordatorios.
              </span>
            ) : (
              <span className="font-semibold text-ink">Respaldo actualizado ✓</span>
            )
          ) : (
            <>
              Tu agenda está respaldada como{" "}
              <span className="font-semibold text-ink">{correoGuardado}</span>
            </>
          )}
        </p>
        {status !== "ok" ? (
          <button
            type="button"
            onClick={actualizar}
            disabled={status === "sending"}
            className="label shrink-0 text-brand underline disabled:opacity-60"
          >
            {status === "sending" ? "Actualizando…" : "Actualizar respaldo"}
          </button>
        ) : null}
        {status === "error" && error ? (
          <p role="alert" className="w-full text-sm font-medium text-error">
            ⚠ {error}
          </p>
        ) : null}
        <div className="w-full">
          <TurnstileWidget onToken={setTurnstileToken} />
        </div>
      </div>
    );
  }

  /* ── Sin respaldar: tarjeta colapsable ── */
  return (
    <div className="card mt-8 px-5 py-5 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-faint">Que no se pierda</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">
            Respaldá tu agenda por correo
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Si cambiás de teléfono o borrás el navegador, tus planes te esperan.
          </p>
        </div>
        {!abierto ? (
          <button
            type="button"
            onClick={() => {
              setAbierto(true);
              track("form_start", { form: "agenda_respaldo" });
            }}
            className="pressable min-h-11 shrink-0 bg-brand px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
          >
            Respaldar
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "ok" ? "Agenda respaldada con éxito." : ""}
      </p>
      {abierto ? (
        status === "ok" ? (
          <div className="mt-4">
            <p className="font-semibold text-ink">¡Listo! Tu agenda quedó respaldada.</p>
          </div>
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
                {status === "sending" ? "Respaldando…" : "Respaldar"}
              </button>
            </div>

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
                <ConsentText text={CONSENT_AGENDA.text} />
              </span>
            </label>

            <TurnstileWidget onToken={setTurnstileToken} />

            {status === "error" && error ? (
              <p role="alert" className="mt-4 text-sm font-medium text-error">
                ⚠ {error}
              </p>
            ) : null}
          </form>
        )
      ) : null}
      <RecuperarAgendaForm />
    </div>
  );
}
