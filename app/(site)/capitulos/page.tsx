import type { Metadata } from "next";
import Link from "next/link";
import { getCapitulos } from "@/lib/sanity/capitulos";
import { TeleRetro } from "@/components/en-vivo/tele-retro";
import { TeleCapitulos } from "@/components/capitulos/tele-capitulos";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

/**
 * /capitulos — el show de SeViveLa, capítulo a capítulo.
 * Misma puesta en escena que /en-vivo (el televisor retro): el episodio
 * más reciente arranca en pantalla y la lista de abajo cambia de canal.
 * Cada lunes el cron de capítulos agrega el programa nuevo del canal de
 * YouTube; sin capítulos aún, la tele queda con barras ("Próximamente").
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Capítulos",
  description:
    "El show de SeViveLa, capítulo a capítulo: mirá cada programa completo, directo desde nuestro canal.",
  alternates: { canonical: "/capitulos" },
};

export default async function CapitulosPage() {
  const capitulos = await getCapitulos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="label text-muted">El show</p>
      <h1 className="mt-3 max-w-3xl font-serif text-[clamp(1.9rem,4.5vw,3.2rem)] font-medium leading-[1.05] text-ink">
        {capitulos.length > 0 ? "Los capítulos de SeViveLa." : "El show ya viene."}
      </h1>

      {capitulos.length > 0 ? (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Capítulos del show de SeViveLa",
              itemListElement: capitulos.slice(0, 10).map((c, i) => ({
                "@type": "VideoObject",
                position: i + 1,
                name: c.titulo,
                uploadDate: c.fecha || undefined,
                thumbnailUrl: `https://i.ytimg.com/vi/${c.youtubeId}/hqdefault.jpg`,
                embedUrl: `https://www.youtube-nocookie.com/embed/${c.youtubeId}`,
                publisher: { "@type": "Organization", name: site.name, url: site.url },
              })),
            }}
          />
          <div className="mt-8">
            <TeleCapitulos capitulos={capitulos} />
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Cada semana, el programa completo va a estar aquí — el mismo que
            ves en la tele, para verlo cuando querás.
          </p>
          <div className="mx-auto mt-10 w-full max-w-md">
            <TeleRetro rotulo="Próximamente" />
          </div>
        </>
      )}

      <div className="mt-12 border-t border-rule pt-8">
        <p className="text-sm text-muted">
          ¿Hay transmisión ahora mismo?{" "}
          <Link href="/en-vivo" className="ulink text-ink">
            Pasá por En vivo
          </Link>
          {" · "}
          <Link href="/videos" className="ulink text-ink">
            o mirá la videoteca
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
