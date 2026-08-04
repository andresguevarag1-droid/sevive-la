"use client";

/**
 * Enlace de una tarjeta de reel: si el reel tiene `videoUrl` abre el video
 * real (IG/TikTok/YouTube) en pestaña nueva; si no, lleva a la videoteca.
 * Cada toque queda medido (recirc_click · module videoteca).
 */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { track } from "@/lib/analytics/track";

export function ReelCardLink({
  href,
  className,
  style,
  children,
}: {
  /** URL del video real; si falta, la tarjeta lleva a /videos. */
  href?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const destino = href || "/videos";
  const externo = /^https?:\/\//i.test(destino);
  const alClic = () =>
    track("recirc_click", { module: "videoteca", href: destino });

  return externo ? (
    <a
      href={destino}
      target="_blank"
      rel="noopener noreferrer"
      onClick={alClic}
      className={className}
      style={style}
    >
      {children}
    </a>
  ) : (
    <Link href={destino} onClick={alClic} className={className} style={style}>
      {children}
    </Link>
  );
}
