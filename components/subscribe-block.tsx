/**
 * Bloque de suscripción — propuesta de valor concreta, no "newsletter".
 * Checkbox de consentimiento NO premarcado (requisito legal, Ley 8968).
 */
export function SubscribeBlock() {
  return (
    <section className="px-4 py-10">
      <div
        className="mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-xl)] p-8 md:p-12"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, var(--color-deep-purple) 0%, transparent 55%), radial-gradient(120% 120% at 100% 100%, var(--color-petrol) 0%, transparent 55%), var(--color-ink)",
        }}
      >
        <div className="max-w-xl">
          <p className="serif-italic text-lg text-white/80">Cada jueves</p>
          <h2 className="mt-1 text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Los mejores planes del fin de semana, en tu correo.
          </h2>
          <p className="mt-3 text-white/70">
            Sin relleno: eventos, aperturas y promos de la semana, curados por el
            equipo de SeViveLa.
          </p>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              aria-label="Correo electrónico"
              className="w-full rounded-[var(--radius-full)] border border-white/15 bg-white/10 px-5 py-3 text-white outline-none placeholder:text-white/50 focus:border-white/40"
            />
            <button
              type="submit"
              className="pressable shrink-0 rounded-[var(--radius-full)] bg-brand px-6 py-3 font-semibold text-brand-ink transition-colors hover:bg-brand-hover"
            >
              Suscribirme
            </button>
          </form>

          <label className="mt-4 flex items-start gap-2.5 text-sm text-white/70">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-bright)]"
            />
            <span>
              Acepto recibir comunicaciones de SeViveLa y el{" "}
              <a href="/legal/privacidad" className="text-white underline">
                tratamiento de mis datos
              </a>
              . Puedo darme de baja cuando quiera.
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
