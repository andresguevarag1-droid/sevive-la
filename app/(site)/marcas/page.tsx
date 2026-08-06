import type { Metadata } from "next";
import { site, verticalsVisibles } from "@/lib/site";
import { getServiceClient } from "@/lib/supabase/server";
import { FormMarcas } from "@/components/marcas/form-marcas";

export const metadata: Metadata = {
  title: "Para marcas",
  description:
    "Conectá tu marca con audiencias reales en Costa Rica: dinámicas con leads medibles, cuponera con redención comprobable, contenido patrocinado y boletín segmentado por interés.",
  alternates: { canonical: "/marcas" },
};

// Los números viven en Supabase: refrescar cada hora alcanza de sobra.
export const revalidate = 3600;

type Metrica = { valor: string; etiqueta: string };

/**
 * Números vivos del negocio, con piso de publicación: una cifra chiquita
 * vende en contra, así que cada métrica solo aparece cuando supera su
 * mínimo. Si Supabase no está configurado o nada pasa el piso, la banda
 * no se muestra y la página sigue vendiendo con los formatos.
 */
async function getMetricas(): Promise<Metrica[]> {
  const db = getServiceClient();
  if (!db) return [];
  try {
    const [
      { count: personas },
      { count: participaciones },
      { count: cupones },
      { count: intereses },
      { count: interesEventos },
    ] = await Promise.all([
      db.from("people").select("id", { count: "exact", head: true }),
      db.from("campaign_entries").select("id", { count: "exact", head: true }),
      db.from("coupons").select("id", { count: "exact", head: true }),
      db.from("person_interests").select("person_id", { count: "exact", head: true }),
      db.from("event_interest").select("id", { count: "exact", head: true }),
    ]);
    const fmt = (n: number) => new Intl.NumberFormat("es-CR").format(n);
    const metricas: Metrica[] = [];
    if ((personas ?? 0) >= 100) {
      metricas.push({ valor: fmt(personas!), etiqueta: "personas en la comunidad" });
    }
    if ((participaciones ?? 0) >= 100) {
      metricas.push({ valor: fmt(participaciones!), etiqueta: "participaciones en dinámicas" });
    }
    if ((cupones ?? 0) >= 25) {
      metricas.push({ valor: fmt(cupones!), etiqueta: "cupones reclamados" });
    }
    if ((intereses ?? 0) >= 100) {
      metricas.push({ valor: fmt(intereses!), etiqueta: "intereses declarados por vertical" });
    }
    if ((interesEventos ?? 0) >= 50) {
      metricas.push({ valor: fmt(interesEventos!), etiqueta: "leads pidiendo la próxima edición" });
    }
    return metricas.slice(0, 4);
  } catch (err) {
    console.error("[marcas] métricas no disponibles (no fatal):", err);
    return [];
  }
}

const formatos = [
  {
    title: "Dinámicas / giveaways",
    body: "Tu premio, nuestra audiencia: cada participación queda registrada con consentimiento explícito, canal de origen y vertical de interés. Al cierre te entregamos métricas, no promesas.",
  },
  {
    title: "Cuponera con redención medible",
    body: "Cupones únicos con QR que tu local canjea una sola vez. Sabés exactamente cuántos se emitieron, cuántos llegaron a caja y qué canal los trajo.",
  },
  {
    title: "Contenido patrocinado",
    body: "Crónicas, videos y guías con la voz editorial de SeViveLa, siempre etiquetados con transparencia.",
  },
  {
    title: "Boletín",
    body: "Presencia en el correo semanal que la audiencia abre para planear su fin de semana, segmentado por los seis intereses.",
  },
];

const pasos = [
  { n: "01", texto: "Nos contás tu objetivo (lanzamiento, tráfico al local, leads)." },
  { n: "02", texto: "Armamos la propuesta con el formato y la vertical que calzan." },
  { n: "03", texto: "Publicamos, medimos y te entregamos resultados con datos." },
];

export default async function MarcasPage() {
  const metricas = await getMetricas();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <header>
        <p className="label text-brand">Para marcas</p>
        <h1 className="mt-2 max-w-3xl text-[clamp(2.2rem,6vw,4rem)]">
          Audiencias reales, con intereses declarados.
        </h1>
        <p className="measure mt-4 leading-relaxed text-muted">
          {site.name} conecta a tu marca con personas en Costa Rica que ya
          están decidiendo qué vivir: dónde comer, qué evento ir a ver, a dónde
          escaparse. Datos primarios con consentimiento (Ley 8968), segmentados
          por seis verticales de interés — y cada campaña se entrega con
          métricas, no con capturas de pantalla.
        </p>
      </header>

      {/* ── Números vivos (solo cuando hay tracción que mostrar) ── */}
      {metricas.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-ink py-8 md:grid-cols-4">
          {metricas.map((m) => (
            <div key={m.etiqueta}>
              <p className="font-serif text-[clamp(2rem,5vw,3rem)] font-bold leading-none text-ink">
                {m.valor}
              </p>
              <p className="label mt-2 text-faint">{m.etiqueta}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Verticales como mapa de segmentación ── */}
      <div className="mt-10 flex flex-wrap gap-2">
        {verticalsVisibles.map((v) => (
          <span
            key={v.slug}
            className="chip border"
            style={{ borderColor: "var(--color-rule)", color: v.colorVar }}
          >
            {v.name}
          </span>
        ))}
      </div>

      {/* ── Formatos ── */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {formatos.map((f) => (
          <div key={f.title} className="card px-6 py-8">
            <h2 className="text-xl font-bold tracking-tight text-ink">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </div>

      {/* ── Cómo funciona ── */}
      <div className="mt-12">
        <h2 className="text-2xl">Cómo funciona</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          {pasos.map((p) => (
            <li key={p.n} className="border-t-2 border-ink pt-3">
              <span className="label text-brand">{p.n}</span>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Contacto: formulario que deja lead, con mailto de respaldo ── */}
      <div id="contacto" className="mt-12 border-t border-ink pt-8">
        <h2 className="text-2xl">Conversemos.</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Contanos qué querés lograr y armamos la propuesta. Sin compromiso.
        </p>
        <FormMarcas />
        <p className="mt-4 text-sm text-muted">
          ¿Preferís el correo directo?{" "}
          <a
            href={`mailto:hola@${site.domain}?subject=Quiero%20pautar%20con%20SeViveLa`}
            className="underline"
          >
            hola@{site.domain}
          </a>
        </p>
      </div>
    </section>
  );
}
