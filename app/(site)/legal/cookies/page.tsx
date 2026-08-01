import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Qué cookies usa SeViveLa: solo cookies propias y métricas de primera parte, sin rastreadores publicitarios de terceros.",
  alternates: { canonical: "/legal/cookies" },
};

const ACTUALIZACION = "1 de agosto de 2026";

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

        <h2>1. Cookies que usamos</h2>
        <ul>
          <li>
            <strong>Técnicas (necesarias):</strong> las que requiere la
            plataforma para servir el sitio de forma segura y, si aplica, la
            verificación anti-bots (Cloudflare Turnstile) en formularios.
          </li>
          <li>
            <strong>Métricas de primera parte:</strong> un identificador
            anónimo propio para medir visitas e interacciones. No permite
            identificarte y no se comparte con redes publicitarias.
          </li>
        </ul>

        <h2>2. Lo que NO usamos</h2>
        <p>
          No usamos píxeles publicitarios ni rastreadores de terceros que te
          sigan por internet.
        </p>

        <h2>3. Cómo gestionarlas</h2>
        <p>
          Podés borrar o bloquear cookies desde la configuración de tu
          navegador. Bloquear las técnicas puede afectar el funcionamiento de
          los formularios.
        </p>

        <p className="mt-8">
          Más detalle sobre el tratamiento de datos en la{" "}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </div>
    </article>
  );
}
