/**
 * Webhook de revalidación: Sanity → sitio en segundos (sin esperar el ISR de 60s).
 *
 * Configuración en sanity.io/manage (la hace el dueño):
 *  URL:     https://<dominio>/api/revalidate
 *  Trigger: create, update, delete
 *  Secret:  el mismo valor que SANITY_WEBHOOK_SECRET en Vercel
 *  Proyección sugerida: {_type, "slug": slug.current, vertical}
 */
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

export const runtime = "nodejs";

type WebhookPayload = {
  _type?: string;
  slug?: string;
  vertical?: string;
};

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "SANITY_WEBHOOK_SECRET no configurado." },
      { status: 503 }
    );
  }

  let body: WebhookPayload | null | undefined;
  let isValidSignature: boolean | null = null;
  try {
    ({ body, isValidSignature } = await parseBody<WebhookPayload>(req, secret));
  } catch (err) {
    console.error("[revalidate] cuerpo inválido:", err);
    return NextResponse.json({ ok: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!isValidSignature) {
    return NextResponse.json({ ok: false, error: "Firma inválida." }, { status: 401 });
  }

  const revalidated: string[] = [];
  const marcar = (path: string) => {
    revalidatePath(path);
    revalidated.push(path);
  };

  // Home: la portada refleja casi cualquier publicación.
  marcar("/");

  if (body?.vertical) marcar(`/${body.vertical}`);

  switch (body?._type) {
    case "cronica":
      if (body.slug) marcar(`/cronica/${body.slug}`);
      break;
    case "evento":
      marcar("/agenda");
      if (body.slug) marcar(`/agenda/${body.slug}`);
      break;
    case "reel":
      marcar("/videos");
      break;
    case "beneficio":
      marcar("/promociones");
      if (body.slug) marcar(`/promociones/${body.slug}`);
      break;
    case "transmision":
      marcar("/en-vivo");
      break;
    case "campana":
    case "dinamica":
      marcar("/dinamicas");
      if (body.slug) {
        marcar(`/dinamicas/${body.slug}`);
        marcar(`/legal/bases/${body.slug}`);
      }
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}
