import Link from "next/link";

/** Divisor de sección estilo revista: número + etiqueta sobre regla gruesa. */
export function SectionHead({
  index,
  label,
  href,
  action = "Ver todo",
}: {
  index: string;
  label: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-b border-ink pb-2">
      <span className="label tnum text-faint">{index}</span>
      <h2 className="label text-ink">{label}</h2>
      {href ? (
        <Link href={href} className="ulink ml-auto text-[12px] font-medium text-muted">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
