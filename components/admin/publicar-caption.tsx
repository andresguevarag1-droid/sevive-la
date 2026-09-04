"use client";

/**
 * Buzón de publicación: pegá el caption de un post de IG y la IA crea el
 * evento en la agenda (la alternativa manual mientras no hay token de
 * Instagram). La clave se guarda en el navegador para no repetirla.
 */
import { useEffect, useState, type FormEvent } from "react";

type Resultado =
  | { ok: true; creado: true; evento: { titulo: string; fecha: string; hora: string; lugar: string; url: string } }
  | { ok: true; creado: false; motivo: string }
  | { ok: false; error: string };

export function PublicarCaption() {
  const [clave, setClave] = useState("");
  const [caption, setCaption] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [enlace, setEnlace] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    try {
      setClave(localStorage.getItem("svl_admin_key") ?? "");
    } catch {
      /* almacenamiento bloqueado */
    }
  }, []);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setResultado(null);
    try {
      localStorage.setItem("svl_admin_key", clave);
    } catch {
      /* sin memoria de clave */
    }
    try {
      const res = await fetch("/api/admin/ig-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // El endpoint acepta la clave del panel o el CRON_SECRET.
          "x-admin-key": clave,
          Authorization: `Bearer ${clave}`,
        },
        body: JSON.stringify({
          caption,
          imagenUrl: imagenUrl.trim(),
          enlace: enlace.trim(),
        }),
      });
      const data = (await res.json().catch(() => null)) as Resultado | null;
      setResultado(data ?? { ok: false, error: "Respuesta inválida del servidor." });
      if (data && "creado" in data && data.creado) {
        setCaption("");
        setImagenUrl("");
        setEnlace("");
      }
    } catch {
      setResultado({ ok: false, error: "Sin conexión. Intentá de nuevo." });
    }
    setEnviando(false);
  }

  const campo =
    "mt-2 w-full rounded-[var(--radius-sm)] border border-rule bg-white px-3 py-2.5 text-ink outline-none placeholder:text-faint focus:border-ink";

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-medium text-ink">Publicar desde un post</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Pegá el texto del post de Instagram: la IA detecta el evento, lo crea en la
        agenda con sus datos, y de ahí la maquinaria sigue sola (nota de anuncio a las
        6:40, guía cerca de la fecha, corrección y publicación a las 7:15).
      </p>

      <form onSubmit={enviar} className="mt-8" aria-busy={enviando}>
        <label className="block">
          <span className="label text-muted">Clave (CRON_SECRET o clave del panel)</span>
          <input
            type="password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className={campo}
            autoComplete="current-password"
          />
        </label>
        <label className="mt-5 block">
          <span className="label text-muted">Texto del post (caption completo)</span>
          <textarea
            required
            rows={8}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={"🎤 ¡Se viene X en Parque Viva!\nSábado 12 de octubre, 8 pm…"}
            className={campo}
          />
        </label>
        <label className="mt-5 block">
          <span className="label text-muted">URL de la imagen (opcional)</span>
          <input
            type="url"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            placeholder="https://… (clic derecho sobre la foto → Copiar dirección de la imagen)"
            className={campo}
          />
        </label>
        <label className="mt-5 block">
          <span className="label text-muted">Link del post (opcional)</span>
          <input
            type="url"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://www.instagram.com/p/…"
            className={campo}
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="pressable mt-6 min-h-11 bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
        >
          {enviando ? "Analizando…" : "Crear evento en la agenda"}
        </button>
      </form>

      <div aria-live="polite" className="mt-6">
        {resultado && "error" in resultado ? (
          <p role="alert" className="text-sm font-medium text-error">
            ⚠ {resultado.error}
          </p>
        ) : null}
        {resultado && "creado" in resultado && !resultado.creado ? (
          <p className="text-sm leading-relaxed text-muted">🤔 {resultado.motivo}</p>
        ) : null}
        {resultado && "creado" in resultado && resultado.creado ? (
          <div className="rounded-[var(--radius-md)] border border-rule bg-white p-4">
            <p className="font-semibold text-ink">✅ Evento creado</p>
            <p className="mt-1 text-sm text-muted">
              {resultado.evento.titulo} · {resultado.evento.fecha} · {resultado.evento.hora} ·{" "}
              {resultado.evento.lugar}
            </p>
            <a href={resultado.evento.url} className="ulink mt-2 inline-block text-sm text-ink">
              Ver en la agenda →
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
