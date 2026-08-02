/**
 * URL corta estable para el link-in-bio: /participar
 * Redirige a la landing de la campaña ACTIVA (leída de Sanity) conservando
 * los UTMs. Cuando cambie la campaña, el link de Instagram no se toca.
 * Fallback: /dinamicas si no hay campaña activa.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getCampanaActiva } from "@/lib/sanity/campana";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const campana = await getCampanaActiva();
  const destino = new URL(
    campana ? `/dinamicas/${campana.slug}` : "/dinamicas",
    req.nextUrl.origin
  );
  // Conservar UTMs y cualquier otro parámetro de la URL corta.
  req.nextUrl.searchParams.forEach((value, key) => {
    destino.searchParams.set(key, value);
  });
  return NextResponse.redirect(destino, 307);
}
