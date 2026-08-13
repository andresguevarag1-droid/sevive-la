import type { Metadata } from "next";
import Link from "next/link";
import { getEstadoEnVivo } from "@/lib/sanity/transmision";
import { AvisameEnVivo } from "@/components/en-vivo/avisame";
import { TeleRetro } from "@/components/en-vivo/tele-retro";

/**
 * /en-vivo — la casa de las transmisiones.
 * Dos estados, ambos con branding 100% del sitio:
 *  - EN VIVO: reproduce la emisión de YouTube (video oculto/no listado)
 *    dentro de la página. El iframe no suma al presupuesto de JS propio.
 *  - En reposo: anuncia la próxima transmisión (si hay) y captura correos
 *    ("avisame cuando empiece") — la audiencia del live es un segmento.
 * ISR de 60s + webhook de Sanity: encender el interruptor en el Studio
 * enciende esta página en segundos.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "En vivo",
  description:
    "Transmisiones en vivo de SeViveLa: coberturas, eventos y experiencias de Costa Rica, en directo.",
  alternates: { canonical: "/en-vivo" },
};

function fmtFechaCR(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Costa_Rica",
  }).format(d);
}

export default async function EnVivoPage() {
  const { activa, proxima } = await getEstadoEnVivo();
  const alAire = activa && activa.youtubeId ? activa : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {alAire ? (
        <>
          {/* ── EN VIVO ── */}
          <p className="label flex items-center gap-2 text-brand">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            En vivo ahora
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-[clamp(1.9rem,4.5vw,3.2rem)] font-medium leading-[1.05] text-ink">
            {alAire.titulo}
          </h1>
          {alAire.descripcion ? (
            <p className="mt-3 max-w-2xl leading-relaxed text-muted">
              {alAire.descripcion}
            </p>
          ) : null}

          {/* El player vive dentro del televisor retro. Iframe de YouTube
              en modo privacidad (nocookie): cero SDKs, el JS propio de la
              ruta no crece. */}
          <div className="mx-auto mt-8 max-w-4xl">
            <TeleRetro>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${alAire.youtubeId}?autoplay=1&playsinline=1&rel=0`}
                title={alAire.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </TeleRetro>
          </div>

          <div className="mt-10 border-t border-rule pt-8">
            <h2 className="label text-ink">Que no se te pase la próxima</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">
              Dejanos tu correo y te avisamos cada vez que arranquemos una
              transmisión.
            </p>
            <AvisameEnVivo />
          </div>
        </>
      ) : (
        <>
          {/* ── En reposo: el televisor con barras de ajuste manda ── */}
          <p className="label text-muted">Transmisiones</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[clamp(1.9rem,4.5vw,3.2rem)] font-medium leading-[1.05] text-ink">
            Ahora no estamos en vivo.
          </h1>

          <div className="mt-10 grid items-start gap-10 md:grid-cols-2 md:gap-12">
            <div className="mx-auto w-full max-w-md md:max-w-none">
              <TeleRetro rotulo="Fuera del aire" />
            </div>
            <div>
              {proxima?.programadaPara ? (
                <p className="text-lg leading-relaxed text-ink">
                  La próxima transmisión ya tiene fecha:{" "}
                  <strong className="font-semibold">{proxima.titulo}</strong>,
                  el {fmtFechaCR(proxima.programadaPara)}.
                </p>
              ) : (
                <p className="leading-relaxed text-muted">
                  Cuando haya una cobertura en directo —un evento, una
                  apertura, una experiencia— este es el lugar donde se ve.
                </p>
              )}

              <div className="mt-8">
                <h2 className="label text-ink">Avisame cuando empiece</h2>
                <AvisameEnVivo />
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-rule pt-8">
            <p className="text-sm text-muted">
              Mientras tanto:{" "}
              <Link href="/agenda" className="ulink text-ink">
                mirá la agenda de la semana
              </Link>{" "}
              o{" "}
              <Link href="/videos" className="ulink text-ink">
                pasá por la videoteca
              </Link>
              .
            </p>
          </div>
        </>
      )}
    </div>
  );
}
