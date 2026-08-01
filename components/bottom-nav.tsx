"use client";

/**
 * Bottom navigation tipo app — el elemento que convierte la web en "plataforma".
 * - Fija abajo, 64px + safe-area-inset (notch de iPhone).
 * - Se oculta al hacer scroll hacia abajo y reaparece al subir.
 * - Estado activo con color de marca.
 * - Solo se muestra en móvil (< md); en desktop la navegación vive en el header.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { bottomNav } from "@/lib/site";
import { iconMap } from "@/components/icons";

export function BottomNav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      // umbral pequeño para evitar parpadeo; nunca ocultar cerca del tope
      if (Math.abs(y - lastY.current) > 8) {
        setHidden(goingDown && y > 80);
        lastY.current = y;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Navegación principal"
      data-hidden={hidden}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/90 pb-safe backdrop-blur-lg transition-transform duration-300 ease-[var(--ease-drawer)] data-[hidden=true]:translate-y-full md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
        {bottomNav.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex h-full min-w-[44px] flex-col items-center justify-center gap-1 text-[11px] font-medium data-[active=true]:text-brand"
                data-active={active}
                style={active ? { color: "var(--color-brand)" } : { color: "var(--color-muted)" }}
              >
                <Icon width={22} height={22} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
