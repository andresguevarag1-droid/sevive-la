import Link from "next/link";
import type { Story } from "@/lib/content";
import { verticalColor } from "@/lib/content";
import { getVertical } from "@/lib/site";
import { getEmitidosPorBeneficio } from "@/lib/server/beneficio-stats";
import { TarjetaBeneficio, type DatosTarjeta } from "@/components/tarjeta-beneficio";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Beneficios como cupones de revista con señales que venden:
 * urgencia real (vigencia y cupos desde Sanity + emitidos de Supabase),
 * prueba social ("N ya lo reclamaron") y estado personal ("Ya lo tenés",
 * resuelto en cliente). El servidor pre-calcula todo; la tarjeta solo pinta.
 */

/** Separa la oferta en cifra protagonista y letra chica.
 *  "30% · código VIVELA30" → grande "30%", resto "código VIVELA30". */
function partirOferta(meta: string): { grande: string; resto?: string } {
  const m = meta.trim();
  const porPunto = m.split("·").map((s) => s.trim());
  if (porPunto.length > 1 && porPunto[0].length <= 8) {
    return { grande: porPunto[0], resto: porPunto.slice(1).join(" · ") };
  }
  const [primero, ...resto] = m.split(" ");
  if (/^(\d+%|2x1|2×1|gratis)$/i.test(primero)) {
    return { grande: primero.replace(/x/i, "×"), resto: resto.join(" ") || undefined };
  }
  return { grande: m };
}

/** Días que faltan para que venza (fin del día de vigencia, hora CR). */
function diasParaVencer(vigencia?: string): number | null {
  if (!vigencia) return null;
  const fin = new Date(`${vigencia}T23:59:59-06:00`).getTime();
  if (Number.isNaN(fin)) return null;
  return Math.max(0, Math.ceil((fin - Date.now()) / 86400000) - 1);
}

/** UN sticker por cupón (el más urgente): agotado > quedan pocos > vence. */
function stickerUrgencia(
  vigencia?: string,
  cupoMaximo?: number,
  emitidos?: number
): { texto: string; brand: boolean; agotado: boolean } | null {
  if (cupoMaximo && typeof emitidos === "number") {
    const restante = cupoMaximo - emitidos;
    if (restante <= 0) return { texto: "Agotado", brand: false, agotado: true };
    if (restante <= Math.max(5, Math.ceil(cupoMaximo * 0.2))) {
      return { texto: `¡Quedan ${restante}!`, brand: true, agotado: false };
    }
    return { texto: `Quedan ${restante}`, brand: false, agotado: false };
  }
  const dias = diasParaVencer(vigencia);
  if (dias === null) return null;
  if (dias === 0) return { texto: "¡Vence hoy!", brand: true, agotado: false };
  if (dias === 1) return { texto: "¡Vence mañana!", brand: true, agotado: false };
  if (dias <= 3) return { texto: `¡Vence en ${dias} días!`, brand: true, agotado: false };
  if (dias <= 14) return { texto: `Vence en ${dias} días`, brand: false, agotado: false };
  return null;
}

export async function Beneficios({
  items,
  gridClassName = "md:grid-cols-3",
  conVendedora = false,
}: {
  items: Story[];
  /** Columnas del grid (ej. "grid-cols-1" para un solo cupón ancho). */
  gridClassName?: string;
  /** Cierra la fila con la tarjeta "¿Tenés un local?" → /marcas. */
  conVendedora?: boolean;
}) {
  const emitidosPorSlug = await getEmitidosPorBeneficio();

  const tarjetas: DatosTarjeta[] = items.map((b) => {
    const slug = b.href?.split("/")[2] ?? "";
    const emitidos = emitidosPorSlug.get(slug);
    const oferta = partirOferta(b.meta ?? "");
    const s = stickerUrgencia(b.vigencia, b.cupoMaximo, emitidos);
    return {
      id: b.id,
      href: b.href ?? "/promociones",
      slug,
      marca: b.author,
      patrocinado: b.sponsored,
      titulo: b.title,
      verticalNombre: getVertical(b.vertical)?.name,
      color: verticalColor(b.vertical),
      ofertaGrande: oferta.grande,
      ofertaResto: oferta.resto,
      urgencia: s ? [{ texto: s.texto, brand: s.brand }] : undefined,
      emitidos,
      agotado: s?.agotado,
    };
  });

  return (
    <div className={`grid gap-4 ${gridClassName}`}>
      {tarjetas.map((t) => (
        <TarjetaBeneficio key={t.id} {...t} />
      ))}

      {/* ── La tarjeta vendedora: el espacio se vende solo ── */}
      {conVendedora ? (
        <Link
          href="/marcas"
          data-reveal
          className="card pressable group relative flex overflow-hidden"
        >
          <div className="flex min-w-0 flex-1 flex-col px-5 py-5">
            <p className="label text-faint">SeViveLa · Para marcas</p>
            <h3 className="mt-1.5 text-xl font-bold tracking-tight leading-snug text-ink transition-colors group-hover:text-brand">
              ¿Tenés un local? Este espacio vende.
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Cupones medibles: sabés cuántos se reclaman y cuántos llegan a caja.
            </p>
            <p className="label mt-auto flex items-center gap-1.5 pt-5 text-brand">
              Conversemos
              <ArrowRightIcon
                width={14}
                height={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </p>
          </div>
          <div aria-hidden className="relative w-0 border-l border-dashed border-rule">
            <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-paper" />
            <span className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-paper" />
          </div>
          <div className="relative flex w-[40%] max-w-44 shrink-0 flex-col items-center justify-center bg-ink px-4 py-6 text-center text-white">
            <p className="text-[clamp(1.2rem,3vw,1.5rem)] font-black uppercase leading-tight tracking-tight">
              Tu marca
              <br />
              aquí
            </p>
            <span
              aria-hidden
              className="label absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-white/40"
              style={{ writingMode: "vertical-rl" }}
            >
              SEVIVELA
            </span>
          </div>
        </Link>
      ) : null}
    </div>
  );
}
