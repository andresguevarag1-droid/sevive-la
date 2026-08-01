import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de uso del sitio de SeViveLa: contenido editorial, dinámicas gratuitas, propiedad intelectual y responsabilidad.",
  alternates: { canonical: "/legal/terminos" },
};

const ACTUALIZACION = "1 de agosto de 2026";

export default function TerminosPage() {
  return (
    <article className="prose-editorial leading-relaxed text-ink/90">
      <header className="border-b border-rule pb-6">
        <p className="label text-faint">Legal</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)]">
          Términos y Condiciones
        </h1>
        <p className="mt-3 text-sm text-muted">
          Última actualización: {ACTUALIZACION}
        </p>
      </header>

      <div className="measure mt-6">
        <p>
          Bienvenido(a) a <strong>{site.name}</strong> ({site.url}), una
          plataforma de descubrimiento de experiencias, entretenimiento,
          cultura, gastronomía, turismo y estilo de vida en Costa Rica. Al usar
          este sitio aceptás estos términos.
        </p>

        <h2>1. Uso del sitio</h2>
        <p>
          El contenido de {site.name} es informativo y editorial. Podés
          navegarlo libremente; algunos servicios (boletín, dinámicas) requieren
          que nos dejés datos personales con tu consentimiento, según nuestra{" "}
          <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>

        <h2>2. Dinámicas y giveaways</h2>
        <ul>
          <li>
            La participación en nuestras dinámicas es{" "}
            <strong>siempre gratuita</strong>: nunca se exige compra ni pago
            para participar.
          </li>
          <li>
            Cada dinámica tiene sus propias bases legales publicadas en el
            sitio, que detallan mecánica, fechas, premio y responsable.
          </li>
          <li>
            Se permite una participación por persona por dinámica, salvo que
            las bases indiquen otra cosa.
          </li>
        </ul>

        <h2>3. Contenido patrocinado</h2>
        <p>
          Cuando una marca paga por aparecer en {site.name}, ese contenido se
          etiqueta claramente como patrocinado o en alianza. La línea editorial
          del resto del contenido es independiente.
        </p>

        <h2>4. Eventos y datos de terceros</h2>
        <p>
          Publicamos información de eventos, lugares y promociones de terceros
          de buena fe y procurando su exactitud, pero fechas, precios y
          condiciones pueden cambiar sin previo aviso. Verificá siempre con el
          organizador antes de asistir. {site.name} no es responsable por
          cancelaciones ni cambios de terceros.
        </p>

        <h2>5. Propiedad intelectual</h2>
        <p>
          Los textos, fotografías, videos, marcas y diseño de {site.name} están
          protegidos por derechos de autor. Podés compartir enlaces a nuestro
          contenido; no está permitida su reproducción comercial sin
          autorización escrita.
        </p>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          El sitio se ofrece &ldquo;tal cual&rdquo;. Hacemos lo razonable para
          mantenerlo disponible y seguro, pero no garantizamos disponibilidad
          ininterrumpida ni ausencia de errores.
        </p>

        <h2>7. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de la República de Costa Rica.
          Cualquier controversia se someterá a los tribunales costarricenses.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Escribinos a{" "}
          <a href={`mailto:hola@${site.domain}`}>hola@{site.domain}</a>.
        </p>
      </div>
    </article>
  );
}
