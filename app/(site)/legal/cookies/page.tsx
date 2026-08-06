import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { PreferenciasCookies } from "@/components/preferencias-cookies";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Qué cookies usa SeViveLa: solo cookies propias y métricas de primera parte, sin rastreadores publicitarios de terceros.",
  alternates: { canonical: "/legal/cookies" },
};

const ACTUALIZACION = "5 de agosto de 2026";

export default function CookiesPage() {
  return (
    <article className="prose-editorial leading-relaxed text-ink/90">
      <header className="border-b border-rule pb-6">
        <p className="label text-faint">Legal</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)]">
          Política de Cookies
        </h1>
        <p className="mt-3 text-sm text-muted">
          Última actualización: {ACTUALIZACION}
        </p>
      </header>

      <div className="measure mt-6">
        <p>
          En <strong>{site.name}</strong> usamos las cookies mínimas necesarias
          para que el sitio funcione y para entender, de forma agregada, cómo se
          usa.
        </p>

        <h2>1. Lo que corre siempre (necesario)</h2>
        <ul>
          <li>
            <strong>Técnicas:</strong> lo que requiere la plataforma para
            servir el sitio de forma segura y la verificación anti-bots
            (Cloudflare Turnstile) en formularios.
          </li>
          <li>
            <strong>Métricas sin cookies:</strong> Vercel Analytics y Speed
            Insights miden visitas y velocidad de forma agregada, sin cookies
            ni identificadores persistentes.
          </li>
          <li>
            <strong>Tu experiencia en este dispositivo:</strong> guardamos en
            el almacenamiento local de tu navegador tus planes guardados
            (sv_favoritos), tus cupones reclamados (sv_cupones), el correo de
            tu respaldo de agenda (sv_agenda_correo) y tu decisión sobre este
            aviso (sv_consent_v2). Nada de eso sale de tu dispositivo salvo
            que uses las funciones que lo envían (p. ej. respaldar tu agenda).
          </li>
        </ul>

        <h2>2. Lo que corre solo si aceptás</h2>
        <ul>
          <li>
            <strong>Analítica de producto (PostHog):</strong> mide qué
            secciones e interacciones se usan, con un identificador propio.
            Solo se carga si tocás &laquo;Aceptar&raquo; en el aviso.
          </li>
          <li>
            <strong>Atribución de origen (sv_attr):</strong> si llegaste desde
            una campaña (parámetros UTM o similares), guardamos ese origen por
            hasta 90 días para saber qué canal te trajo. También requiere tu
            aceptación.
          </li>
        </ul>

        <h2>3. Lo que NO usamos</h2>
        <p>
          No usamos píxeles publicitarios ni rastreadores de terceros que te
          sigan por internet.
        </p>

        <h2>4. Cambiar tu decisión</h2>
        <p>
          Podés cambiar tu decisión cuando quieras con el botón de abajo (el
          aviso vuelve a aparecer), o borrar los datos guardados desde la
          configuración de tu navegador.
        </p>
        <PreferenciasCookies />

        <p className="mt-8">
          Más detalle sobre el tratamiento de datos en la{" "}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </div>
    </article>
  );
}
