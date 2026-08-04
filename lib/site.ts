/**
 * Configuración central del sitio y datos de las 6 verticales.
 * Fuente de verdad para navegación, colores por vertical y metadata.
 */

/**
 * URL pública del sitio: configurable por env para que los links absolutos
 * (correos, canonicals, sitemap, QR) funcionen en cualquier despliegue.
 * Prioridad: NEXT_PUBLIC_SITE_URL → dominio de producción de Vercel → sevive.la.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://sevive.la");

export const site = {
  name: "SeViveLa",
  domain: "sevive.la",
  url: siteUrl,
  tagline: "Descubrí qué vivir en la región.",
  description:
    "Plataforma de entretenimiento, cultura, experiencias, ocio y estilo de vida en Costa Rica.",
  locale: "es-CR",
} as const;

/** Slugs de las verticales — usados en rutas y como clave de color. */
export type VerticalSlug =
  | "experiencias"
  | "entretenimiento"
  | "cultura"
  | "ocio"
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
  /**
   * Oculta del menú, bandas, footer, buscador y sitemap — la página y su
   * contenido siguen existiendo por URL directa. (Turismo espera el permiso
   * del ICT; Gastronomía en pausa editorial.)
   */
  oculta?: boolean;
};

/** Orden = orden en el menú y en las bandas de la home. */
export const verticals: Vertical[] = [
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
    slug: "experiencias",
    name: "Experiencias",
    verb: "Vive",
    blurb: "Tours, talleres, aventuras y planes de fin de semana.",
    colorVar: "var(--color-experiencias)",
  },
  {
    slug: "ocio",
    name: "Ocio",
    verb: "Desconecta",
    blurb: "Tiempo libre, juegos, parques y planes sin agenda.",
    colorVar: "var(--color-ocio)",
  },
  {
    slug: "estilo-de-vida",
    name: "Estilo de vida",
    verb: "Inspírate",
    blurb: "Bienestar, moda, tendencias, personas y comunidad.",
    colorVar: "var(--color-estilo)",
  },
  {
    slug: "gastronomia",
    name: "Gastronomía",
    verb: "Saborea",
    blurb: "Restaurantes, bares, cafeterías, food trucks y rutas.",
    colorVar: "var(--color-gastronomia)",
    oculta: true,
  },
  {
    slug: "turismo",
    name: "Turismo",
    verb: "Descubre",
    blurb: "Destinos, playas, volcanes, hospedaje y escapadas.",
    colorVar: "var(--color-turismo)",
    oculta: true,
  },
];

/** Verticales públicas: las que aparecen en navegación, home y footer. */
export const verticalsVisibles: Vertical[] = verticals.filter((v) => !v.oculta);

/** Redes sociales de la marca (confirmar handles con el equipo). */
export const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/sevive.la", icon: "instagram" },
  { name: "TikTok", href: "https://www.tiktok.com/@sevive.la", icon: "tiktok" },
] as const;

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
