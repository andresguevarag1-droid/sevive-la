import { RecircLink } from "@/components/recirc-link";

/**
 * Divisor de sección estilo revista: número + etiqueta sobre regla gruesa.
 * `tone="dark"` para usarlo sobre bandas de tinta (texto papel).
 */
export function SectionHead({
  index,
  label,
  href,
  action = "Ver todo",
  tone = "light",
}: {
  index: string;
  label: string;
  href?: string;
  action?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      data-reveal
      className={`mb-6 flex items-baseline gap-3 border-b pb-2 ${
        dark ? "border-paper/40" : "border-ink"
      }`}
    >
      <span className="label tnum text-brand">{index}</span>
      <h2 className={`label ${dark ? "text-paper" : "text-ink"}`}>{label}</h2>
      {href ? (
        <RecircLink
          href={href}
          module={`section_${label.toLowerCase().replace(/\s+/g, "_")}`}
          className={`ulink ml-auto text-[12px] font-medium ${
            dark ? "text-paper/70 hover:text-paper" : "text-muted"
          }`}
        >
          {action}
        </RecircLink>
      ) : null}
    </div>
  );
}
