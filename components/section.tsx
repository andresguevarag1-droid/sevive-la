import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Encabezado de sección editorial: kicker + título grande + acción "ver todo".
 */
export function SectionHeader({
  kicker,
  title,
  href,
  action = "Ver todo",
  accent,
}: {
  kicker?: string;
  title: string;
  href?: string;
  action?: string;
  accent?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {kicker ? (
          <p className="kicker mb-1.5" style={{ color: accent ?? "var(--color-brand)" }}>
            {kicker}
          </p>
        ) : null}
        <h2 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          {action}
          <ArrowRightIcon
            width={16}
            height={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  );
}

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-4 py-8 md:py-10 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
