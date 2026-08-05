import type { Metadata } from "next";
import Link from "next/link";
import { verificarFirma } from "@/lib/server/email";
import { getServiceClient } from "@/lib/supabase/server";
import { RestaurarAgenda, type ItemRespaldo } from "@/components/evento/restaurar-agenda";

export const metadata: Metadata = {
  title: "Recuperar mi agenda",
  robots: { index: false },
};

// El token viene en la URL: la página siempre se evalúa por solicitud.
export const dynamic = "force-dynamic";

function Estado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
      <p className="label text-faint">Recuperar mi agenda</p>
      <h1 className="mx-auto mt-3 max-w-lg text-3xl">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{texto}</p>
      <Link
        href="/mi-agenda"
        className="pressable mt-8 inline-block bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-ink transition-colors hover:bg-brand-hover"
      >
        Ir a mi agenda
      </Link>
    </section>
  );
}

export default async function RecuperarAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e, t } = await searchParams;
  let email = "";
  try {
    email = e ? Buffer.from(e, "base64url").toString("utf8") : "";
  } catch {
    email = "";
  }

  if (!email || !t || !verificarFirma(email, t)) {
    return (
      <Estado
        titulo="Este enlace no es válido."
        texto="Puede que esté incompleto o vencido. Pedí uno nuevo desde Mi agenda → Recuperar."
      />
    );
  }

  const db = getServiceClient();
  if (!db) {
    return (
      <Estado
        titulo="Estamos en configuración."
        texto="Probá de nuevo en unos minutos."
      />
    );
  }

  const { data: persona } = await db
    .from("people")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  const { data: filas } = persona
    ? await db
        .from("saved_events")
        .select("event_slug, event_title, inicio, lugar, vertical")
        .eq("person_id", persona.id)
        .limit(100)
    : { data: null };

  const items: ItemRespaldo[] = (filas ?? []).map((f) => ({
    slug: f.event_slug as string,
    title: f.event_title as string,
    inicio: (f.inicio as string | null) ?? "",
    lugar: (f.lugar as string | null) ?? undefined,
    vertical: f.vertical as ItemRespaldo["vertical"],
  }));

  if (items.length === 0) {
    return (
      <Estado
        titulo="No encontramos planes respaldados."
        texto="Este correo no tiene una agenda respaldada todavía. Guardá planes y respaldalos desde Mi agenda."
      />
    );
  }

  return <RestaurarAgenda items={items} email={email} />;
}
