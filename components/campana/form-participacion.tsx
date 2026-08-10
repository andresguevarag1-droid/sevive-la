"use client";

/**
 * Formulario de participación en campaña (reemplaza al Google Form).
 * Réplica del contrato: correo, nombre, residencia, teléfono y 3 preguntas
 * de elegibilidad. Consentimiento y bases NUNCA premarcados (Ley 8968).
 * Estados: idle → sending → ok | error. Nunca se pierde lo tipeado.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { consentParticipacion } from "@/lib/consent";
import {
  PROVINCIAS_CR,
  isValidEmail,
  isValidPhone,
} from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { InstagramIcon } from "@/components/icons";
import { ConsentText } from "@/components/consent-text";
import { track } from "@/lib/analytics/track";
import { utmEnvio } from "@/lib/analytics/utm-client";

type ErrorCampo = { campo: string; mensaje: string };

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
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const resumenRef = useRef<HTMLDivElement>(null);
  const formStartEnviado = useRef(false);
  const [yaParticipaba, setYaParticipaba] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [contador, setContador] = useState<{ referrals: number; chances: number } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  const [restaurado, setRestaurado] = useState(false);

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
          setRestaurado(true);
          setStatus("ok");
        }
      }
    } catch {
      /* localStorage bloqueado (webview estricta): sin memoria, sin drama */
    }
    setPuedeCompartir(typeof navigator !== "undefined" && "share" in navigator);
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contador en vivo: al montar, al volver a la pestaña y cada 30s.
  useEffect(() => {
    if (status !== "ok" || !referralCode) return;
    let cancelado = false;
    const consultar = () => {
      fetch(`/api/dinamica/chances?slug=${campaignSlug}&code=${referralCode}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelado && data?.ok) {
            setContador({ referrals: data.referrals, chances: data.chances });
          }
        })
        .catch(() => {});
    };
    consultar();
    const alVolver = () => {
      if (document.visibilityState === "visible") consultar();
    };
    const intervalo = setInterval(() => { if (document.visibilityState === "visible") consultar(); }, 30000);
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [status, referralCode, campaignSlug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError("");

    // Validación ligera en cliente; el servidor re-valida con Zod (fuente de
    // verdad). Se recogen TODOS los errores y se anuncian juntos (A1/A7).
    const honeypot =
      (new FormData(e.currentTarget).get("website") as string) || "";
    const fallas: ErrorCampo[] = [];
    if (!isValidEmail(email))
      fallas.push({ campo: "f-email", mensaje: "Escribí un correo válido." });
    if (fullName.trim().length < 2)
      fallas.push({ campo: "f-nombre", mensaje: "Contanos tu nombre completo." });
    if (!residence)
      fallas.push({ campo: "f-provincia", mensaje: "Elegí tu provincia." });
    if (!isValidPhone(phone))
      fallas.push({ campo: "f-telefono", mensaje: "Escribí un teléfono válido." });
    for (const p of preguntasElegibilidad) {
      if (respuestas[p.key] === null)
        fallas.push({ campo: `f-eleg-${p.key}`, mensaje: `Respondé: ${p.label}` });
    }
    if (!consent)
      fallas.push({
        campo: "f-consent",
        mensaje: "Necesitamos tu consentimiento para participar.",
      });
    if (!acceptsRules)
      fallas.push({
        campo: "f-bases",
        mensaje: "Tenés que aceptar las bases y condiciones.",
      });

    setErrores(fallas);
    if (fallas.length > 0) {
      setStatus("error");
      for (const f of fallas) {
        track("form_field_error", { field: f.campo, dynamic_slug: campaignSlug });
      }
      // Anunciar y enfocar el resumen (lectores de pantalla + teclado).
      requestAnimationFrame(() => resumenRef.current?.focus());
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
          // Atribución: los UTM de la página pisan al first-touch guardado,
          // pero SOLO las claves con valor (el server component manda las
          // claves aunque vengan undefined, y eso borraba el origen real) y
          // recortadas al tope del esquema del servidor.
          utm: {
            ...utmEnvio(),
            ...Object.fromEntries(
              Object.entries(utm ?? {})
                .filter(([, v]) => typeof v === "string" && v)
                .map(([k, v]) => [
                  k,
                  (v as string).slice(0, k === "source" || k === "medium" ? 80 : 120),
                ])
            ),
          },
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
        track("form_submit_success", { dynamic_slug: campaignSlug });
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
    const mensajeCompartir = `¡Estoy participando por ${premio ?? "un premio"} en @sevive.la! Entrá con mi link y los dos sumamos chances 👉 ${referralUrl}`;
    const mensajeWhatsApp = encodeURIComponent(mensajeCompartir);
    const copiarLink = async () => {
      track("referral_share_click", { dynamic_slug: campaignSlug, metodo: "copiar" });
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        /* clipboard bloqueado: el input queda seleccionable a mano */
      }
    };
    const compartir = () => {
      track("referral_share_click", { dynamic_slug: campaignSlug, metodo: "nativo" });
      navigator
        .share({ title: "SeViveLa", text: mensajeCompartir, url: referralUrl })
        .catch(() => {});
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
                className="tnum w-full bg-transparent text-base text-ink outline-none"
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
              onClick={() => track("referral_share_click", { dynamic_slug: campaignSlug, metodo: "whatsapp" })}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable inline-flex flex-1 items-center justify-center rounded-[var(--radius-full)] px-5 py-3 text-sm font-bold text-white"
                style={{ background: "#25D366" }}
              >
                Compartir por WhatsApp
              </a>
              {puedeCompartir ? (
                <button
                  type="button"
                  onClick={compartir}
                  className="pressable rounded-[var(--radius-full)] border border-ink px-5 py-3 text-sm font-bold text-ink"
                >
                  Compartir…
                </button>
              ) : null}
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

        {restaurado ? (
          <p className="mt-5">
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(claveLocal);
                } catch {
                  /* sin memoria local */
                }
                setReferralCode("");
                setReferralUrl("");
                setContador(null);
                setYaParticipaba(false);
                setRestaurado(false);
                setStatus("idle");
              }}
              className="text-sm text-muted underline"
            >
              ¿No sos vos? Participá con otro correo
            </button>
          </p>
        ) : null}
      </div>
    );
  }

  // ¿Este campo está en la lista de errores? (para aria-invalid)
  const inv = (id: string) => (errores.some((f) => f.campo === id) ? true : undefined);

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      onFocusCapture={() => {
        if (!formStartEnviado.current) {
          formStartEnviado.current = true;
          track("form_start", { dynamic_slug: campaignSlug });
        }
      }}
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
            id="f-email"
            type="email"
            name="email"
            aria-invalid={inv("f-email")}
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
            id="f-nombre"
            type="text"
            name="fullName"
            aria-invalid={inv("f-nombre")}
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
            id="f-provincia"
            name="residence"
            aria-invalid={inv("f-provincia")}
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
            id="f-telefono"
            type="tel"
            name="phone"
            aria-invalid={inv("f-telefono")}
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

      {/* ── Elegibilidad: radios nativos estilados como pastillas (A3/U4).
            Teclado y lector de pantalla los anuncian como grupo requerido. ── */}
      <div className="mt-7 space-y-5">
        {preguntasElegibilidad.map((p) => (
          <fieldset key={p.key} id={`f-eleg-${p.key}`} aria-invalid={inv(`f-eleg-${p.key}`)}>
            <legend className="label text-faint">{p.label} *</legend>
            <div className="mt-2 flex gap-2">
              {[
                { valor: true, texto: "Sí" },
                { valor: false, texto: "No" },
              ].map((opcion) => {
                const activo = respuestas[p.key] === opcion.valor;
                return (
                  <label
                    key={opcion.texto}
                    className="pressable flex min-h-11 min-w-20 cursor-pointer items-center justify-center rounded-[var(--radius-full)] border px-5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
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
                    <input
                      type="radio"
                      name={`eleg-${p.key}`}
                      value={opcion.texto}
                      checked={activo}
                      disabled={status === "sending"}
                      onChange={() =>
                        setRespuestas((r) => ({ ...r, [p.key]: opcion.valor }))
                      }
                      className="sr-only"
                    />
                    {opcion.texto}
                  </label>
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
          className="mt-0.5 h-5 w-5 shrink-0"
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
          id="f-consent"
          type="checkbox"
          required
          aria-invalid={inv("f-consent")}
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "sending"}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          <ConsentText text={consentDef.text} />
        </span>
      </label>
      <label className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          id="f-bases"
          type="checkbox"
          required
          aria-invalid={inv("f-bases")}
          checked={acceptsRules}
          onChange={(e) => setAcceptsRules(e.target.checked)}
          disabled={status === "sending"}
          className="mt-0.5 h-5 w-5 shrink-0"
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
                <a href={`#${f.campo}`} className="text-sm text-error underline">
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
