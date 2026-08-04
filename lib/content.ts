/**
 * Contenido representativo del home (mock). En producción: Sanity + Supabase.
 * Estructurado como una portada de revista: una nota líder, un índice de la
 * semana, notas destacadas con firma, video e índice de beneficios.
 */
import type { VerticalSlug } from "@/lib/site";

export type ContentType =
  | "articulo"
  | "video"
  | "galeria"
  | "evento"
  | "lugar"
  | "promo";

export const typeLabel: Record<ContentType, string> = {
  articulo: "Crónica",
  video: "Video",
  galeria: "Galería",
  evento: "Agenda",
  lugar: "Lugar",
  promo: "Beneficio",
};

export type Story = {
  id: string;
  type: ContentType;
  vertical: VerticalSlug;
  title: string;
  dek?: string; // bajada
  author?: string; // firma
  meta: string; // fecha / duración / lectura
  img?: string; // ruta de imagen (public/)
  sponsored?: boolean; // contenido patrocinado (siempre etiquetado)
  href?: string; // destino del enlace (detalle); si falta, la vertical
  /** ISO del inicio (solo eventos): alimenta <time datetime> y JSON-LD. */
  fechaIso?: string;
};

/**
 * Imágenes generadas (documentales, mismo grado de color). Se sirven desde CDN
 * en la maqueta; en producción se suben a Sanity/almacenamiento propio.
 */
const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3Gw4v501AXr5C77XvUBZkzv6kEb";
export const IMG = {
  fair: `${CDN}/hf_20260801_045952_14583af5-ea3e-4837-8339-49a16b1e7fb5_min.webp`,
  food: `${CDN}/hf_20260801_045954_af905c89-90f3-41f3-a84f-d4d49b9b1ba7_min.webp`,
  landscape: `${CDN}/hf_20260801_045956_66ede2b3-2f64-4cb6-8d18-e5523a6370e6_min.webp`,
  street: `${CDN}/hf_20260801_050345_acb138f2-3255-47fc-8c35-9255c16b8117_min.webp`,
} as const;

export function verticalColor(slug: VerticalSlug): string {
  const map: Record<VerticalSlug, string> = {
    experiencias: "var(--color-experiencias)",
    entretenimiento: "var(--color-entretenimiento)",
    cultura: "var(--color-cultura)",
    ocio: "var(--color-ocio)",
    gastronomia: "var(--color-gastronomia)",
    turismo: "var(--color-turismo)",
    "estilo-de-vida": "var(--color-estilo)",
  };
  return map[slug];
}

/** Nota líder de portada. */
export const lead: Story = {
  id: "lead",
  type: "articulo",
  vertical: "gastronomia",
  title: "La ciudad se come en la calle",
  dek: "Ferias nocturnas, sodas de barrio y cocineros que convirtieron el fin de semana en un plan. Una guía para comer bien sin reservación.",
  author: "Redacción SeViveLa",
  meta: "Crónica · 8 min",
  img: IMG.fair,
};

/** Índice de la semana — filas tipográficas con regla de pelo. */
export const week: Story[] = [
  { id: "w1", type: "evento", vertical: "gastronomia", title: "Festival del Chicharrón, Puriscal", meta: "Jue 6 · 11:00" },
  { id: "w2", type: "evento", vertical: "entretenimiento", title: "Sonámbulo en vivo, Anfiteatro Coca-Cola", meta: "Vie 7 · 20:00" },
  { id: "w3", type: "evento", vertical: "cultura", title: "Noche de museos, Barrio Amón", meta: "Vie 7 · 18:00" },
  { id: "w4", type: "evento", vertical: "experiencias", title: "Feria de las Flores, Zarcero", meta: "Sáb 8 · 09:00" },
  { id: "w5", type: "evento", vertical: "turismo", title: "Amanecer guiado, Volcán Poás", meta: "Dom 9 · 05:00" },
  { id: "w6", type: "evento", vertical: "estilo-de-vida", title: "Mercado de diseño local, Barrio Escalante", meta: "Dom 9 · 10:00" },
];

/** Notas destacadas con firma e imagen. */
export const features: Story[] = [
  {
    id: "f1",
    type: "articulo",
    vertical: "turismo",
    title: "Cinco escapadas a menos de dos horas de San José",
    dek: "Playa, montaña y aguas termales para un fin de semana sin avión.",
    author: "María José Rojas",
    meta: "Guía · 6 min",
    img: IMG.landscape,
  },
  {
    id: "f2",
    type: "articulo",
    vertical: "cultura",
    title: "El barrio que se volvió lienzo",
    dek: "Murales, cafés y una escena que reescribe el centro de la capital.",
    author: "Daniel Vargas",
    meta: "Crónica · 5 min",
    img: IMG.street,
  },
  {
    id: "f3",
    type: "articulo",
    vertical: "gastronomia",
    title: "En defensa del casado",
    dek: "Por qué el plato más común del país es también el más difícil de hacer bien.",
    author: "Redacción",
    meta: "Ensayo · 4 min",
    img: IMG.food,
  },
];

/** Video (una fila breve). */
export const videos: Story[] = [
  { id: "v1", type: "video", vertical: "gastronomia", title: "Las mejores sodas de Cartago", meta: "1:04", img: IMG.food },
  { id: "v2", type: "video", vertical: "turismo", title: "Amanecer en el Volcán Poás", meta: "0:48", img: IMG.landscape },
  { id: "v3", type: "video", vertical: "entretenimiento", title: "Detrás del festival Picnic", meta: "1:22", img: IMG.fair },
];

/** Beneficios (índice restringido). */
export const beneficios: Story[] = [
  { id: "b1", type: "promo", vertical: "gastronomia", title: "Brunch de La Ventana", meta: "30% · código VIVELA30", author: "La Ventana" },
  { id: "b2", type: "promo", vertical: "experiencias", title: "Tour de café Doka", meta: "2x1 entre semana", author: "Doka Estate" },
  { id: "b3", type: "promo", vertical: "turismo", title: "Noche en Nosara", meta: "Gratis para suscriptores", author: "Bodhi Tree" },
];
