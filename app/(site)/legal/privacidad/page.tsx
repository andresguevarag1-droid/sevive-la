import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo SeViveLa trata tus datos personales según la Ley 8968 de Costa Rica: qué recolectamos, para qué, y tus derechos de acceso, rectificación y eliminación.",
  alternates: { canonical: "/legal/privacidad" },
};

const ACTUALIZACION = "1 de agosto de 2026";

export default function PrivacidadPage() {
  return (
    <article className="prose-editorial leading-relaxed text-ink/90">
      <header className="border-b border-rule pb-6">
        <p className="label text-faint">Legal</p>
        <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)]">
          Política de Privacidad
        </h1>
        <p className="mt-3 text-sm text-muted">
          Última actualización: {ACTUALIZACION}
        </p>
      </header>

      <div className="measure mt-6">
        <p>
          En <strong>{site.name}</strong> ({site.url}) tratamos tus datos
          personales conforme a la{" "}
          <strong>
            Ley N.º 8968 de Protección de la Persona frente al Tratamiento de
            sus Datos Personales
          </strong>{" "}
          de Costa Rica y su reglamento. Esta política explica qué datos
          recolectamos, para qué los usamos y cómo podés ejercer tus derechos.
        </p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          {site.name} es responsable de las bases de datos de personas usuarias
          de este sitio. Podés contactarnos para cualquier tema de datos
          personales escribiendo a{" "}
          <a href={`mailto:hola@${site.domain}`}>hola@{site.domain}</a>.
        </p>

        <h2>2. Qué datos recolectamos y cuándo</h2>
        <ul>
          <li>
            <strong>Boletín:</strong> correo electrónico y, si lo indicás, tu
            nombre.
          </li>
          <li>
            <strong>Dinámicas y giveaways:</strong> nombre, correo electrónico,
            teléfono (opcional) y tus respuestas al formulario de la dinámica.
          </li>
          <li>
            <strong>Registro de consentimiento:</strong> junto con tu alta
            guardamos el texto exacto del consentimiento que aceptaste, su
            versión, la fecha y hora, tu dirección IP y el identificador de tu
            navegador (user-agent), como prueba de que el consentimiento fue
            otorgado.
          </li>
          <li>
            <strong>Uso del sitio:</strong> métricas de navegación de primera
            parte (páginas vistas, interacciones), asociadas a un identificador
            anónimo. No usamos rastreadores publicitarios de terceros.
          </li>
        </ul>

        <h2>3. Para qué usamos tus datos</h2>
        <ul>
          <li>Enviarte el boletín al que te suscribiste.</li>
          <li>
            Gestionar tu participación en dinámicas: registrar tu entrada,
            contactarte si resultás ganador(a) y publicar resultados según las
            bases de cada dinámica.
          </li>
          <li>
            Entender qué contenidos y verticales te interesan, para mostrarte
            contenido y beneficios más relevantes.
          </li>
          <li>
            Compartir con marcas aliadas únicamente <strong>métricas
            agregadas y anónimas</strong> (por ejemplo, cuántas personas
            participaron en una dinámica). <strong>Nunca vendemos ni cedemos tus
            datos personales identificables</strong> sin tu consentimiento
            expreso y específico.
          </li>
        </ul>

        <h2>4. Base legal: tu consentimiento</h2>
        <p>
          Solo tratamos tus datos con tu <strong>consentimiento explícito,
          previo e informado</strong>: las casillas de aceptación nunca vienen
          premarcadas y cada formulario indica el propósito del tratamiento.
          Podés retirar tu consentimiento en cualquier momento sin que eso
          afecte la licitud del tratamiento previo.
        </p>

        <h2>5. Dónde se guardan tus datos</h2>
        <p>
          Tus datos se almacenan en proveedores de infraestructura que actúan
          como encargados del tratamiento: Supabase (base de datos), Vercel
          (alojamiento del sitio) y Resend (envío de correos). Todos aplican
          medidas de seguridad técnicas y organizativas, y el acceso a los
          datos está restringido al equipo autorizado de {site.name}.
        </p>

        <h2>6. Cuánto tiempo los conservamos</h2>
        <p>
          Conservamos tus datos mientras mantengás tu suscripción o mientras
          la finalidad siga vigente. Si te das de baja, dejamos de enviarte
          comunicaciones de inmediato y eliminamos o anonimizamos tus datos
          dentro de un plazo razonable, salvo que debamos conservar alguna
          evidencia por obligación legal.
        </p>

        <h2>7. Tus derechos (acceso, rectificación, eliminación)</h2>
        <p>
          En cualquier momento podés solicitar el acceso a los datos que
          tenemos sobre vos, su rectificación, su eliminación, o revocar tu
          consentimiento. Escribinos a{" "}
          <a href={`mailto:hola@${site.domain}`}>hola@{site.domain}</a> desde el
          correo registrado y atenderemos tu solicitud en los plazos que exige
          la ley. También podés darte de baja del boletín con el enlace incluido
          en cada correo.
        </p>

        <h2>8. Menores de edad</h2>
        <p>
          Nuestros formularios están dirigidos a personas mayores de 18 años.
          Si detectamos datos de una persona menor sin autorización de quien
          ejerza la patria potestad, los eliminaremos.
        </p>

        <h2>9. Cambios a esta política</h2>
        <p>
          Si cambiamos esta política, publicaremos la nueva versión en esta
          página con su fecha de actualización. Los cambios sustanciales se
          comunicarán por los canales habituales.
        </p>

        <p className="mt-8">
          Ver también los{" "}
          <Link href="/legal/terminos">Términos y Condiciones</Link>.
        </p>
      </div>
    </article>
  );
}
