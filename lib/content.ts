/**
 * Contenido representativo para el home (mock).
 * En producción esto viene de Sanity (contenido) + Supabase (estado/datos).
 * Sirve para dar vida a la maqueta y validar el sistema de diseño.
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
  articulo: "Artículo",
  video: "Video",
  galeria: "Galería",
  evento: "Evento",
  lugar: "Lugar",
  promo: "Promo",
};

export type Item = {
  id: string;
  type: ContentType;
  vertical: VerticalSlug;
  title: string;
  meta: string;
  featured?: boolean;
  sponsored?: string;
};

/** Devuelve la variable CSS del color de una vertical. */
export function verticalColor(slug: VerticalSlug): string {
  const map: Record<VerticalSlug, string> = {
    experiencias: "var(--color-experiencias)",
    entretenimiento: "var(--color-entretenimiento)",
    cultura: "var(--color-cultura)",
    gastronomia: "var(--color-gastronomia)",
    turismo: "var(--color-turismo)",
    "estilo-de-vida": "var(--color-estilo)",
  };
  return map[slug];
}

/** Rail "Pasando ahora" — lo urgente/fresco. */
export const pasandoAhora: Item[] = [
  { id: "pa1", type: "evento", vertical: "gastronomia", title: "Festival del Chicharrón en Puriscal", meta: "Hoy · 11:00 a. m." },
  { id: "pa2", type: "promo", vertical: "entretenimiento", title: "2x1 en entradas — Jazz Café Escazú", meta: "Vence en 2 días", sponsored: "Jazz Café" },
  { id: "pa3", type: "evento", vertical: "cultura", title: "Noche de museos en el Barrio Amón", meta: "Hoy · 6:00 p. m." },
  { id: "pa4", type: "evento", vertical: "entretenimiento", title: "Concierto: Sonámbulo en el Anfiteatro", meta: "Mañana · 8:00 p. m." },
  { id: "pa5", type: "galeria", vertical: "experiencias", title: "Cobertura: Feria de las Flores, Zarcero", meta: "Nueva galería" },
];

/** Videoteca (9:16). */
export const videos: Item[] = [
  { id: "v1", type: "video", vertical: "gastronomia", title: "Las mejores sodas de Cartago", meta: "1:04" },
  { id: "v2", type: "video", vertical: "turismo", title: "Amanecer en el Volcán Poás", meta: "0:48" },
  { id: "v3", type: "video", vertical: "entretenimiento", title: "Detrás del festival Picnic", meta: "1:22" },
  { id: "v4", type: "video", vertical: "experiencias", title: "Canopy en Monteverde", meta: "0:56" },
  { id: "v5", type: "video", vertical: "estilo-de-vida", title: "Rutina tica de fin de semana", meta: "1:10" },
];

/** Editorial destacado — jerarquía de revista (1 grande + 3 chicos). */
export const editorial: Item[] = [
  { id: "e1", type: "articulo", vertical: "gastronomia", title: "Guía definitiva de sodas: 15 imperdibles de la GAM", meta: "8 min de lectura", featured: true },
  { id: "e2", type: "articulo", vertical: "turismo", title: "Cinco escapadas de fin de semana a menos de 2 horas", meta: "6 min" },
  { id: "e3", type: "articulo", vertical: "cultura", title: "El renacer del teatro independiente en San José", meta: "5 min" },
  { id: "e4", type: "articulo", vertical: "estilo-de-vida", title: "Bienestar tico: dónde desconectarse este mes", meta: "4 min" },
];

/** Promociones activas. */
export const promos: Item[] = [
  { id: "p1", type: "promo", vertical: "gastronomia", title: "30% en el brunch de La Ventana", meta: "Código VIVELA30", sponsored: "La Ventana" },
  { id: "p2", type: "promo", vertical: "experiencias", title: "Tour de café con 2x1 entre semana", meta: "Vence en 5 días", sponsored: "Doka Estate" },
  { id: "p3", type: "promo", vertical: "turismo", title: "Noche gratis en hospedaje de Nosara", meta: "Solo suscriptores", sponsored: "Bodhi Tree" },
];

/** Agenda de la semana — conteo por día. */
export const agendaWeek: { day: string; date: string; count: number; today?: boolean }[] = [
  { day: "Lun", date: "3", count: 4 },
  { day: "Mar", date: "4", count: 6 },
  { day: "Mié", date: "5", count: 3 },
  { day: "Jue", date: "6", count: 9, today: true },
  { day: "Vie", date: "7", count: 14 },
  { day: "Sáb", date: "8", count: 18 },
  { day: "Dom", date: "9", count: 7 },
];
