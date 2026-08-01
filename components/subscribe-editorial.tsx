/**
 * Boletín — bloque de tinta plano (sin orbes ni degradados).
 * Inputs con subrayado editorial. Consentimiento NO premarcado (Ley 8968).
 */
export function SubscribeEditorial() {
  return (
    <section className="px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl bg-ink px-6 py-12 text-paper md:px-14 md:py-16">
        <div className="max-w-2xl">
          <span className="label text-paper/55">Boletín · cada jueves</span>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,3rem)] font-medium leading-[1.05] text-paper">
            Los mejores planes del fin de semana, en tu correo.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-paper/70">
            Eventos, aperturas y beneficios de la semana, curados por la
            redacción. Sin relleno.
          </p>

          <form className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="label text-paper/50">Correo</span>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                aria-label="Correo electrónico"
                className="mt-2 w-full border-b border-paper/30 bg-transparent pb-2 text-paper outline-none placeholder:text-paper/40 focus:border-paper"
              />
            </label>
            <button
              type="submit"
              className="pressable shrink-0 bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Suscribirme
            </button>
          </form>

          <label className="mt-5 flex items-start gap-2.5 text-sm text-paper/65">
            <input type="checkbox" required className="mt-1 h-3.5 w-3.5 shrink-0" />
            <span>
              Acepto el{" "}
              <a href="/legal/privacidad" className="underline">
                tratamiento de mis datos
              </a>{" "}
              y puedo darme de baja cuando quiera.
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
