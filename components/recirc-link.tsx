"use client";

/**
 * Link de recirculación medido (R2/R4): igual que un Link, pero registra
 * qué módulo movió a la persona (CTR por módulo en PostHog).
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { track } from "@/lib/analytics/track";

export function RecircLink({
  href,
  module: modulo,
  className,
  children,
}: {
  href: string;
  /** Identificador estable del módulo (ej. "home_agenda_ver_todos"). */
  module: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("recirc_click", { module: modulo })}
    >
      {children}
    </Link>
  );
}
