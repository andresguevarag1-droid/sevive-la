/**
 * Panel de administración · Locales de canje.
 * GET: lista locales + beneficios con cupón (Sanity) + métricas agregadas.
 * POST: crea un local con PIN autogenerado y (opcional) lo envía por correo.
 * Todo protegido por ADMIN_PANEL_KEY (header x-admin-key).
 */
import { NextResponse } from "next/server";
import { adminConfigured, checkAdminKey, generarPinLocal, slugDeNombre } from "@/lib/server/admin";
import { crearLocalSchema } from "@/lib/validation/admin";
import { getServiceClient } from "@/lib/supabase/server";
import { hashVenueToken } from "@/lib/server/coupon";
import { client } from "@/sanity/lib/client";
import { sanityConfigured } from "@/sanity/env";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request-meta";
import { emailEnabled } from "@/lib/server/email";
import { enviarPinPorCorreo } from "@/lib/server/venue-pin";

export const runtime = "nodejs";

type BeneficioOpcion = { slug: string; title: string; marca?: string; vigencia?: string };

function noAutorizado(req: Request): NextResponse | null {
  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, estado: "no_configurado", error: "Falta ADMIN_PANEL_KEY en Vercel." },
      { status: 503 }
    );
  }
  if (!checkAdminKey(req)) {
    return NextResponse.json({ ok: false, estado: "clave_incorrecta" }, { status: 401 });
  }
  return null;
}

async function beneficiosConCupon(): Promise<BeneficioOpcion[]> {
  if (!sanityConfigured) return [];
  try {
    const raw = await client.fetch<BeneficioOpcion[]>(
      /* groq */ `*[_type == "beneficio" && cuponMedible == true && defined(slug.current)]
        | order(title asc){ "slug": slug.current, title, marca, vigencia }`,
      {},
      { next: { revalidate: 60 } }
    );
    return raw ?? [];
  } catch (err) {
    console.error("[admin] beneficios falló:", err);
    return [];
  }
}

export async function GET(req: Request) {
  const bloqueo = noAutorizado(req);
  if (bloqueo) return bloqueo;

  const { allowed } = await checkRateLimit("admin", getClientIp(req));
  if (!allowed) return NextResponse.json({ ok: false, estado: "rate_limited" }, { status: 429 });

  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, estado: "sin_supabase", error: "Supabase no está configurado." },
      { status: 503 }
    );
  }

  const [{ data: venues }, { data: stats }, beneficios] = await Promise.all([
    db.from("venues").select("slug, name, benefit_slugs, created_at").order("created_at", { ascending: false }),
    db.from("coupon_stats").select("benefit_slug, emitidos, canjeados, tasa_redencion"),
    beneficiosConCupon(),
  ]);

  return NextResponse.json({
    ok: true,
    emailActivo: emailEnabled,
    venues: venues ?? [],
    stats: stats ?? [],
    beneficios,
  });
}

export async function POST(req: Request) {
  const bloqueo = noAutorizado(req);
  if (bloqueo) return bloqueo;

  const { allowed } = await checkRateLimit("admin", getClientIp(req));
  if (!allowed) return NextResponse.json({ ok: false, estado: "rate_limited" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }
  const parsed = crearLocalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const db = getServiceClient();
  if (!db) {
    return NextResponse.json(
      { ok: false, estado: "sin_supabase", error: "Supabase no está configurado." },
      { status: 503 }
    );
  }

  const base = slugDeNombre(d.name);
  if (!base) {
    return NextResponse.json({ ok: false, error: "Nombre inválido." }, { status: 400 });
  }
  const pin = generarPinLocal(d.name);

  try {
    // Slug único: si el nombre ya existe, se numera (la-ventana, la-ventana-2…).
    let slug = base;
    let creado = false;
    for (let i = 2; i <= 9 && !creado; i++) {
      const { error } = await db.from("venues").insert({
        slug,
        name: d.name,
        token_hash: hashVenueToken(pin),
        benefit_slugs: d.benefitSlugs.length ? d.benefitSlugs : null,
      });
      if (!error) {
        creado = true;
      } else if (error.code === "23505") {
        slug = `${base}-${i}`;
      } else {
        throw error;
      }
    }
    if (!creado) {
      return NextResponse.json(
        { ok: false, error: "Ya existen demasiados locales con ese nombre." },
        { status: 409 }
      );
    }

    const correo = await enviarPinPorCorreo(d.email, d.name, pin, d.benefitSlugs);

    return NextResponse.json({ ok: true, slug, pin, ...correo });
  } catch (err) {
    console.error("[admin] error creando local:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo crear el local. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
