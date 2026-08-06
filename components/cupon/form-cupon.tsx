"use client";

/**
 * Reclamo de cupón de beneficio: correo + consentimiento (nunca premarcado).
 * Estados: idle → sending → ok | error. Al emitir, redirige a /mi-cupon/<code>.
 */
import { track } from "@/lib/analytics/track";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { consentBeneficio } from "@/lib/consent";
import { isValidEmail } from "@/lib/validation/client";
import { TurnstileWidget } from "@/components/turnstile";
import { ConsentText } from "@/components/consent-text";
import { utmEnvio } from "@/lib/analytics/utm-client";

type Status = "idle" | "sending" | "ok" | "error";

export function FormCupon({ benefitSlug }: { benefitSlug: string }) {
  const [miCodigo, setMiCodigo] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sv_cupones");
      const mios = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      setMiCodigo(mios?.[benefitSlug] ?? null);
    } catch {
      /* sin memoria local */
    }
  }, [benefitSlug]);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const consentDef = consentBeneficio(benefitSlug);

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
      setError("Necesitamos tu consentimiento para emitir el cupón.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/beneficio/reclamar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benefitSlug,
          email: email.trim().toLowerCase(),
          consent: true,
          turnstileToken,
          website: honeypot,
          // Atribución del cupón: el backend ya la guardaba (coupons.source)
          // pero el formulario nunca la enviaba — todo quedaba "directo".
          utm: utmEnvio(),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; code?: string; url?: string }
        | null;
      if (res.ok && data?.ok && data.code) {
        track("coupon_claim", { benefit_slug: benefitSlug });
        // Estado personal: recordar el cupón en este dispositivo para que
        // las tarjetas muestren "Ya lo tenés" y lleven directo al QR.
        try {
          const raw = localStorage.getItem("sv_cupones");
          const mios = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          mios[benefitSlug] = data.code;
          localStorage.setItem("sv_cupones", JSON.stringify(mios));
        } catch {
          /* sin memoria local */
        }
        setStatus("ok");
        router.push(`/mi-cupon/${data.code}`);
      } else {
        setStatus("error");
        setError(data?.error ?? "No pudimos emitir tu cupón. Intentá de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Sin conexión. Revisá tu red e intentá de nuevo.");
    }
  }

  // Ya reclamado en este dispositivo → directo al QR, sin re-pedir correo.
  if (miCodigo) {
    return (
      <div className="card px-6 py-8 text-center md:px-10">
        <p className="label text-brand">Ya tenés este cupón</p>
        <h2 className="mx-auto mt-2 max-w-md text-2xl">
          Tu cupón está listo para usarse.
        </h2>
        <Link
          href={`/mi-cupon/${miCodigo}`}
          className="pressable mt-6 inline-block bg-brand px-6 py-3 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
        >
          Ver mi cupón (con QR)
        </Link>
        <p className="label mt-3 text-faint">Un cupón por persona · Un solo uso</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      className="card px-6 py-8 md:px-10"
    >
      <p className="label text-brand">Cupón gratis</p>
      <h2 className="mt-2 text-2xl">Reclamá tu cupón.</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Te lo mostramos al instante (con QR) y te lo enviamos al correo para
        que lo tengás en el local.
      </p>

      <label className="mt-6 block">
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
          className="mt-2 w-full border-b border-rule bg-transparent pb-2 text-ink outline-none placeholder:text-faint focus:border-ink disabled:opacity-60"
        />
      </label>

      {/* Honeypot anti-bot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <label className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "sending"}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          <ConsentText text={consentDef.text} />
        </span>
      </label>

      <TurnstileWidget onToken={setTurnstileToken} />

      {status === "error" && error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-error">
          ⚠ {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending" || status === "ok"}
        className="pressable mt-6 min-h-12 w-full bg-brand px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" || status === "ok" ? "Emitiendo…" : "Quiero mi cupón"}
      </button>
      <p className="label mt-3 text-center text-faint">
        Un cupón por persona · Un solo uso
      </p>
    </form>
  );
}
