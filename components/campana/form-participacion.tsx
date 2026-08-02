"use client";

/**
 * Formulario de participación en campaña (reemplaza al Google Form).
 * Réplica del contrato: correo, nombre, residencia, teléfono y 3 preguntas
 * de elegibilidad. Consentimiento y bases NUNCA premarcados (Ley 8968).
 * Estados: idle → sending → ok | error. Nunca se pierde lo tipeado.
 */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { consentParticipacion } from "@/lib/consent";
import {
  PROVINCIAS_CR,
  isValidEmail,
  isValidPhone,
} from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { InstagramIcon } from "@/components/icons";

type Status = "idle" | "sending" | "ok" | "error";

type Utm = {
  source?: string;
  medium?: string;
  content?: string;
  campaign?: string;
};

/** Cookie simple (respaldo del ?ref= si la persona navega antes de enviar). */
function setCookie(name: string, value: string, dias: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${dias * 86400};samesite=lax`;
}
function getCookie(name: string): string {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

const inputClass =
  "mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60";

const preguntasElegibilidad = [
  { key: "isOver21", label: "¿Sos mayor de 21 años?" },
  { key: "hasPassport", label: "¿Tenés pasaporte al día?" },
  { key: "hasUsVisa", label: "¿Tenés visa americana al día?" },
] as const;

type PreguntaKey = (typeof preguntasElegibilidad)[number]["key"];

export function FormParticipacion({
  campaignSlug,
  utm,
  premio,
  refInicial,
}: {
  campaignSlug: string;
  utm?: Utm;
  /** Para el mensaje de compartir por WhatsApp. */
  premio?: string;
  /** Código ?ref= con el que llegó la persona (de searchParams). */
  refInicial?: string;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [residence, setResidence] = useState("");
  const [phone, setPhone] = useState("");
  const [respuestas, setRespuestas] = useState<Record<PreguntaKey, boolean | null>>({
    isOver21: null,
    hasPassport: null,
    hasUsVisa: null,
  });
  const [followsIg, setFollowsIg] = useState(false);
  const [consent, setConsent] = useState(false);
  const [acceptsRules, setAcceptsRules] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [yaParticipaba, setYaParticipaba] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [contador, setContador] = useState<{ referrals: number; chances: number } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const consentDef = consentParticipacion(campaignSlug);
  const claveLocal = `sv_refcode_${campaignSlug}`;
  const claveCookie = `sv_ref_${campaignSlug}`;

  // Respaldar el ?ref= en cookie (30 días) y recordar si ya participó aquí.
  useEffect(() => {
    if (refInicial) setCookie(claveCookie, refInicial, 30);
    try {
      const guardado = localStorage.getItem(claveLocal);
      if (guardado) {
        const { code, url } = JSON.parse(guardado) as { code: string; url: string };
        if (code && url) {
          setReferralCode(code);
          setReferralUrl(url);
          setYaParticipaba(true);
          setStatus("ok");
        }
      }
    } catch {
      /* localStorage bloqueado (webview estricta): sin memoria, sin drama */
    }
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contador en vivo de referidos cuando hay código.
  useEffect(() => {
    if (status !== "ok" || !referralCode) return;
    let cancelado = false;
    fetch(`/api/dinamica/chances?slug=${campaignSlug}&code=${referralCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelado && data?.ok) {
          setContador({ referrals: data.referrals, chances: data.chances });
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [status, referralCode, campaignSlug]);

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
    if (fullName.trim().length < 2) {
      setStatus("error");
      setError("Contanos tu nombre completo.");
      return;
    }
    if (!residence) {
      setStatus("error");
      setError("Elegí tu provincia.");
      return;
    }
    if (!isValidPhone(phone)) {
      setStatus("error");
      setError("Escribí un teléfono válido.");
      return;
    }
    for (const p of preguntasElegibilidad) {
      if (respuestas[p.key] === null) {
        setStatus("error");
        setError(`Respondé: ${p.label}`);
        return;
      }
    }
    if (!consent) {
      setStatus("error");
      setError("Necesitamos tu consentimiento para participar.");
      return;
    }
    if (!acceptsRules) {
      setStatus("error");
      setError("Tenés que aceptar las bases y condiciones.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/participar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignSlug,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          residence,
          phone: phone.trim(),
          isOver21: respuestas.isOver21,
          hasPassport: respuestas.hasPassport,
          hasUsVisa: respuestas.hasUsVisa,
          followsIg,
          consent: true,
          acceptsRules: true,
          ref: (refInicial || getCookie(claveCookie) || "").toUpperCase(),
          turnstileToken,
          website: honeypot,
          utm: utm ?? {},
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | {
            ok: boolean;
            error?: string;
            yaParticipaba?: boolean;
            eligible?: boolean;
            referralCode?: string | null;
            referralUrl?: string | null;
          }
        | null;
      if (res.ok && data?.ok) {
        setYaParticipaba(Boolean(data.yaParticipaba));
        setEligible(data.eligible !== false);
        if (data.referralCode && data.referralUrl) {
          setReferralCode(data.referralCode);
          setReferralUrl(data.referralUrl);
          try {
            localStorage.setItem(
              claveLocal,
              JSON.stringify({ code: data.referralCode, url: data.referralUrl })
            );
          } catch {
            /* sin memoria local, no pasa nada */
          }
        }
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
    /* ── Éxito / duplicado, con motor de referidos ── */
    const mensajeWhatsApp = encodeURIComponent(
      `¡Estoy participando por ${premio ?? "un premio"} en @sevive.la! Entrá con mi link y los dos sumamos chances 👉 ${referralUrl}`
    );
    const copiarLink = async () => {
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        /* clipboard bloqueado: el input queda seleccionable a mano */
      }
    };
    const compartir = () => {
      if (navigator.share) {
        navigator
          .share({ title: "SeViveLa", text: mensajeWhatsApp ? undefined : "", url: referralUrl })
          .catch(() => {});
      }
    };

    return (
      <div aria-live="polite" className="card px-6 py-10 text-center md:px-10">
        <p className="label text-brand">
          {yaParticipaba ? "Ya estabas dentro" : "Participación registrada"}
        </p>
        <h3 className="mx-auto mt-3 max-w-md text-3xl">
          {yaParticipaba
            ? "Con este correo ya estás participando. ¡Suerte!"
            : "¡Ya estás participando! 🎉"}
        </h3>
        {!eligible ? (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Te registramos. Ojo: este premio pide ser mayor de 21 con pasaporte
            y visa al día — te avisaremos de dinámicas para las que sí
            califiqués.
          </p>
        ) : null}

        {referralUrl ? (
          <div className="mx-auto mt-8 max-w-md border-t border-rule pt-6 text-left">
            <p className="label text-ink">Sumá más chances</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Por cada amigo que participe con tu link, ganás una oportunidad
              extra en el sorteo.
            </p>

            {/* link personal */}
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-rule bg-paper px-3 py-2.5">
              <input
                readOnly
                value={referralUrl}
                aria-label="Tu link personal"
                onFocus={(e) => e.currentTarget.select()}
                className="tnum w-full bg-transparent text-[13px] text-ink outline-none"
              />
              <button
                type="button"
                onClick={copiarLink}
                className="pressable shrink-0 rounded-[var(--radius-full)] border border-ink px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-ink"
              >
                {copiado ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            {/* compartir: WhatsApp primero */}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${mensajeWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex flex-1 items-center justify-center rounded-[var(--radius-full)] px-5 py-3 text-sm font-bold text-white"
                style={{ background: "#25D366" }}
              >
                Compartir por WhatsApp
              </a>
              <button
                type="button"
                onClick={compartir}
                className="pressable rounded-[var(--radius-full)] border border-ink px-5 py-3 text-sm font-bold text-ink"
              >
                Compartir…
              </button>
            </div>

            {/* contador en vivo */}
            {contador ? (
              <p className="tnum mt-4 rounded-[var(--radius-md)] bg-paper-2 px-4 py-3 text-center text-sm font-semibold text-ink">
                {contador.referrals === 0
                  ? "Todavía nadie entró con tu link — ¡compartilo!"
                  : `${contador.referrals} ${contador.referrals === 1 ? "amigo ya entró" : "amigos ya entraron"} con tu link`}
                {" · "}Tenés {contador.chances}{" "}
                {contador.chances === 1 ? "chance" : "chances"}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Seguí a @sevive.la para enterarte del ganador.
          </p>
        )}

        <a
          href="https://www.instagram.com/sevive.la"
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-6 inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          <InstagramIcon width={18} height={18} />
          Seguir a @sevive.la
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="card px-6 py-8 md:px-10 md:py-10"
    >
      <p className="label text-brand">Participá gratis</p>
      <h3 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] uppercase">
        Tus datos te acercan a las estrellas
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Dejanos tu info, seguí a @sevive.la y ya estás participando.
      </p>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
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
            inputMode="email"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
        <label>
          <span className="label text-faint">Nombre completo *</span>
          <input
            type="text"
            name="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre y apellidos"
            autoComplete="name"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
        <label>
          <span className="label text-faint">¿Dónde vivís? *</span>
          <select
            name="residence"
            required
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            disabled={status === "sending"}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="" disabled>
              Elegí tu provincia
            </option>
            {PROVINCIAS_CR.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label text-faint">Teléfono (opcional)</span>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="8888 8888"
            autoComplete="tel"
            inputMode="tel"
            disabled={status === "sending"}
            className={inputClass}
          />
        </label>
      </div>

      {/* ── Elegibilidad (se captura igual aunque respondas No) ── */}
      <div className="mt-7 space-y-5">
        {preguntasElegibilidad.map((p) => (
          <fieldset key={p.key}>
            <legend className="label text-faint">{p.label} *</legend>
            <div className="mt-2 flex gap-2">
              {[
                { valor: true, texto: "Sí" },
                { valor: false, texto: "No" },
              ].map((opcion) => {
                const activo = respuestas[p.key] === opcion.valor;
                return (
                  <button
                    key={opcion.texto}
                    type="button"
                    aria-pressed={activo}
                    disabled={status === "sending"}
                    onClick={() =>
                      setRespuestas((r) => ({ ...r, [p.key]: opcion.valor }))
                    }
                    className="pressable min-h-11 min-w-20 rounded-[var(--radius-full)] border px-5 py-2 text-sm font-semibold transition-colors"
                    style={
                      activo
                        ? {
                            background: "var(--color-ink)",
                            color: "var(--color-paper)",
                            borderColor: "var(--color-ink)",
                          }
                        : {
                            borderColor: "var(--color-rule)",
                            color: "var(--color-muted)",
                          }
                    }
                  >
                    {opcion.texto}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
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

      {/* ── Follow autodeclarado (no bloqueante) ── */}
      <label className="mt-7 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={followsIg}
          onChange={(e) => setFollowsIg(e.target.checked)}
          disabled={status === "sending"}
          className="mt-1 h-3.5 w-3.5 shrink-0"
        />
        <span>
          Ya sigo a{" "}
          <a
            href="https://www.instagram.com/sevive.la"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            @sevive.la
          </a>{" "}
          en Instagram.
        </span>
      </label>

      {/* ── Legales: obligatorios, nunca premarcados ── */}
      <label className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
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
          <Link href="/legal/privacidad" className="underline">
            Política de Privacidad
          </Link>
          .
        </span>
      </label>
      <label className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          required
          checked={acceptsRules}
          onChange={(e) => setAcceptsRules(e.target.checked)}
          disabled={status === "sending"}
          className="mt-1 h-3.5 w-3.5 shrink-0"
        />
        <span>
          He leído y acepto las{" "}
          <Link href={`/legal/bases/${campaignSlug}`} className="underline">
            bases y condiciones
          </Link>
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
        className="pressable mt-7 min-h-12 w-full bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" ? "Enviando…" : "Quiero participar"}
      </button>
      <p className="label mt-3 text-center text-faint">
        Válido solo para Costa Rica · Participar no cuesta nada
      </p>
    </form>
  );
}
