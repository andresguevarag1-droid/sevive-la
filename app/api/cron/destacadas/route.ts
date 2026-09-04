/**
 * Cron semanal (lunes 7:30 CR): la sección "Destacado" del home se cura
 * sola con datos reales — las 3 crónicas MÁS LEÍDAS de los últimos 7 días
 * (lecturas de PostHog) reciben la marca `destacada`; las anteriores la
 * pierden. Si la semana tuvo poca lectura medible (consentimiento
 * mediante), completa con las publicadas más recientes: la vitrina nunca
 * queda vieja. Duerme sin POSTHOG_PERSONAL_API_KEY/POSTHOG_PROJECT_ID o
 * sin SANITY_API_WRITE_TOKEN.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cronAutorizado } from "@/lib/server/cron-auth";
import {
  escrituraSanityHabilitada,
  getWriteClient,
} from "@/lib/server/sanity-escritura";

export const runtime = "nodejs";
export const maxDuration = 120;

const HOST =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.posthog.com";

/** Slugs de crónica ordenados por lectores únicos en los últimos 7 días. */
async function slugsMasLeidos(): Promise<string[] | null> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  const proyecto = process.env.POSTHOG_PROJECT_ID;
  if (!key || !proyecto) return null;
  const res = await fetch(`${HOST}/api/projects/${proyecto}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: `
          select properties.$pathname as ruta, count(distinct distinct_id) as lectores
          from events
          where event = '$pageview'
            and timestamp > now() - interval 7 day
            and properties.$pathname like '/cronica/%'
          group by ruta
          order by lectores desc
          limit 12`,
      },
    }),
  });
  if (!res.ok) {
    console.error("[cron destacadas] PostHog respondió", res.status);
    return null;
  }
  const data = (await res.json()) as { results?: [string, number][] };
  return (data.results ?? [])
    .map(([ruta]) => (ruta ?? "").replace(/^\/cronica\//, "").replace(/\/$/, ""))
    .filter(Boolean);
}

export async function GET(req: Request) {
  if (!cronAutorizado(req)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  if (!escrituraSanityHabilitada) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Falta SANITY_API_WRITE_TOKEN en Vercel.",
    });
  }
  if (!process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID) {
    return NextResponse.json({
      ok: true,
      estado: "dormido",
      motivo: "Faltan POSTHOG_PERSONAL_API_KEY y/o POSTHOG_PROJECT_ID en Vercel.",
    });
  }
  const db = getWriteClient()!;

  const leidos = (await slugsMasLeidos()) ?? [];

  // Solo cuentan crónicas publicadas (y vivas) — el orden de lectoría manda.
  const publicadas = new Set<string>(
    leidos.length > 0
      ? await db.fetch<string[]>(
          /* groq */ `*[_type == "cronica" && !(_id in path("drafts.**")) && slug.current in $slugs && (!defined(fecha) || fecha <= now())].slug.current`,
          { slugs: leidos }
        )
      : []
  );
  const elegidas = leidos.filter((s) => publicadas.has(s)).slice(0, 3);

  // Relleno con lo más reciente si la lectoría medible no alcanzó para 3.
  if (elegidas.length < 3) {
    const recientes = await db.fetch<string[]>(
      /* groq */ `*[_type == "cronica" && !(_id in path("drafts.**")) && defined(slug.current) && (!defined(fecha) || fecha <= now())] | order(fecha desc)[0...6].slug.current`
    );
    for (const s of recientes ?? []) {
      if (elegidas.length >= 3) break;
      if (!elegidas.includes(s)) elegidas.push(s);
    }
  }
  if (elegidas.length === 0) {
    return NextResponse.json({ ok: true, motivo: "No hay crónicas publicadas aún." });
  }

  const actuales = await db.fetch<{ _id: string; slug: string }[]>(
    /* groq */ `*[_type == "cronica" && destacada == true && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }`
  );
  const nuevas = await db.fetch<{ _id: string; slug: string }[]>(
    /* groq */ `*[_type == "cronica" && slug.current in $slugs && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }`,
    { slugs: elegidas }
  );

  const setActual = new Set((actuales ?? []).map((c) => c.slug));
  const sinCambios =
    setActual.size === elegidas.length && elegidas.every((s) => setActual.has(s));
  if (sinCambios) {
    return NextResponse.json({ ok: true, destacadas: elegidas, cambio: false });
  }

  // Un solo viaje: las viejas pierden la marca, las nuevas la reciben.
  let tx = db.transaction();
  for (const c of actuales ?? []) {
    if (!elegidas.includes(c.slug)) {
      tx = tx.patch(c._id, (p) => p.set({ destacada: false }));
    }
  }
  for (const c of nuevas ?? []) {
    tx = tx.patch(c._id, (p) => p.set({ destacada: true }));
  }
  await tx.commit();
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    destacadas: elegidas,
    porLectoria: elegidas.filter((s) => publicadas.has(s)).length,
    porRecencia: elegidas.filter((s) => !publicadas.has(s)).length,
    cambio: true,
  });
}
