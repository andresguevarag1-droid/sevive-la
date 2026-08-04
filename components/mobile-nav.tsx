"use client";

/**
 * Navegación inferior móvil (webview in-app de IG/TikTok). Minimal, editorial:
 * regla de pelo superior, etiquetas pequeñas, activo en magenta.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNav } from "@/lib/site";
import { iconMap } from "@/components/icons";
import { track } from "@/lib/analytics/track";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-paper/95 pb-safe backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around">
        {bottomNav.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => track("nav_click", { item: item.href, nav: "bottom" })}
                className="flex h-full min-w-[44px] flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide"
                style={{ color: active ? "var(--color-brand)" : "var(--color-faint)" }}
              >
                <Icon width={21} height={21} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
