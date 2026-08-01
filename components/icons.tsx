/**
 * Set de íconos SVG inline (sin dependencias) para mantener el bundle mínimo.
 * Trazo de 1.75, hereda currentColor. Áreas táctiles se manejan en el contenedor.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HomeIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function PlayIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 4.5 19 12 6 19.5z" />
    </svg>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2A3.2 3.2 0 0 1 16 11.6M17.5 20a5.5 5.5 0 0 0-2-4.3" />
    </svg>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Mapa nombre → componente, para datos declarativos (bottomNav). */
export const iconMap = {
  home: HomeIcon,
  search: SearchIcon,
  calendar: CalendarIcon,
  play: PlayIcon,
  users: UsersIcon,
} as const;

export type IconName = keyof typeof iconMap;
