/**
 * Configuración central del sitio y datos de las 6 verticales.
 * Fuente de verdad para navegación, colores por vertical y metadata.
 */

export const site = {
  name: "SeViveLa",
  domain: "sevive.la",
  url: "https://sevive.la",
  tagline: "Descubrí qué vivir en la región.",
  description:
    "Plataforma de experiencias, entretenimiento, cultura, gastronomía, turismo y estilo de vida en Costa Rica.",
  locale: "es-CR",
} as const;

/** Slugs de las verticales — usados en rutas y como clave de color. */
export type VerticalSlug =
  | "experiencias"
  | "entretenimiento"
  | "cultura"
  | "gastronomia"
  | "turismo"
  | "estilo-de-vida";

export type Vertical = {
  slug: VerticalSlug;
  name: string;
  /** Verbo de marca que acompaña a la vertical (Vive, Disfruta, Conoce…). */
  verb: string;
  /** Descripción corta para tarjetas y metadata. */
  blurb: string;
  /** Variable CSS del color de identidad (definida en globals.css). */
  colorVar: string;
};

export const verticals: Vertical[] = [
  {
    slug: "experiencias",
    name: "Experiencias",
    verb: "Vive",
    blurb: "Tours, talleres, aventuras y planes de fin de semana.",
    colorVar: "var(--color-experiencias)",
  },
  {
    slug: "entretenimiento",
    name: "Entretenimiento",
    verb: "Disfruta",
    blurb: "Conciertos, fiestas, shows, vida nocturna y festivales.",
    colorVar: "var(--color-entretenimiento)",
  },
  {
    slug: "cultura",
    name: "Cultura",
    verb: "Conoce",
    blurb: "Arte, teatro, música local, historia, tradición y ferias.",
    colorVar: "var(--color-cultura)",
  },
  {
    slug: "gastronomia",
    name: "Gastronomía",
    verb: "Saborea",
    blurb: "Restaurantes, bares, cafeterías, food trucks y rutas.",
    colorVar: "var(--color-gastronomia)",
  },
  {
    slug: "turismo",
    name: "Turismo",
    verb: "Descubre",
    blurb: "Destinos, playas, volcanes, hospedaje y escapadas.",
    colorVar: "var(--color-turismo)",
  },
  {
    slug: "estilo-de-vida",
    name: "Estilo de vida",
    verb: "Inspírate",
    blurb: "Bienestar, moda, tendencias, personas y comunidad.",
    colorVar: "var(--color-estilo)",
  },
];

/** Ítems del bottom-nav móvil (tipo app). Orden = orden en pantalla. */
export const bottomNav = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/buscar", label: "Explorar", icon: "search" },
  { href: "/agenda", label: "Agenda", icon: "calendar" },
  { href: "/videos", label: "Videos", icon: "play" },
  { href: "/comunidad", label: "Comunidad", icon: "users" },
] as const;

export function getVertical(slug: string): Vertical | undefined {
  return verticals.find((v) => v.slug === slug);
}
