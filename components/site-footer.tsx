import Link from "next/link";
import { site, verticalsVisibles, socialLinks } from "@/lib/site";
import { getCampanaActiva } from "@/lib/sanity/campana";
import { InstagramIcon, TikTokIcon } from "@/components/icons";

const socialIcons = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
} as const;

/**
 * Footer de tinta: cierre editorial oscuro con tagline serif grande,
 * columnas tituladas, redes sociales y colofón. Texto papel sobre tinta.
 * Enlaza las bases de la campaña activa (si hay).
 */
export async function SiteFooter() {
  const campana = await getCampanaActiva();

  // Mapa del sitio completo: toda página pública tiene su link aquí.
  const columnas: { titulo: string; links: { href: string; label: string }[] }[] = [
    {
      titulo: "Secciones",
      links: verticalsVisibles.map((v) => ({ href: `/${v.slug}`, label: v.name })),
    },
    {
      titulo: "Explorá",
      links: [
        { href: "/agenda", label: "Agenda" },
        { href: "/mi-agenda", label: "Mi agenda" },
        { href: "/videos", label: "Videos" },
        { href: "/promociones", label: "Cuponera" },
        { href: "/dinamicas", label: "Dinámicas" },
        ...(campana ? [{ href: "/participar", label: "Participá" }] : []),
        { href: "/buscar", label: "Buscar" },
        { href: "/#boletin", label: "Boletín" },
      ],
    },
    {
      titulo: "SeViveLa",
      links: [
        { href: "/nosotros", label: "Nosotros" },
        { href: "/comunidad", label: "Comunidad" },
        { href: "/marcas", label: "Para marcas" },
      ],
    },
    {
      titulo: "Legal",
      links: [
        { href: "/legal/privacidad", label: "Privacidad" },
        { href: "/legal/terminos", label: "Términos" },
        { href: "/legal/cookies", label: "Cookies" },
        ...(campana
          ? [{ href: `/legal/bases/${campana.slug}`, label: "Bases de la dinámica" }]
          : []),
      ],
    },
  ];

  return (
    <footer
      className="mt-12 px-4 pb-10 pt-12 text-paper md:pt-16"
      style={{ background: "var(--color-ink)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* ── Marca + tagline ── */}
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr] md:gap-16">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="SeViveLa"
              width={44}
              height={44}
              className="h-10 w-10 invert"
            />
            <p className="headline mt-5 text-[clamp(1.6rem,3.5vw,2.2rem)] leading-tight text-paper">
              {site.tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">
              Guía viva de entretenimiento, cultura, experiencias y ocio de Costa Rica.
            </p>

            {/* redes sociales */}
            <div className="mt-6 flex gap-2">
              {socialLinks.map((s) => {
                const Icon = socialIcons[s.icon];
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} en ${s.name}`}
                    className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-paper/20 text-paper/80 transition-colors hover:border-paper/50 hover:text-paper"
                  >
                    <Icon width={19} height={19} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── Columnas de navegación ── */}
          <nav
            aria-label="Mapa del sitio"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
          >
            {columnas.map((col) => (
              <div key={col.titulo}>
                <p className="label text-paper/60">{col.titulo}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="ulink text-sm text-paper/80 hover:text-paper"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ── Colofón ── */}
        <div className="mt-12 flex flex-col gap-2 border-t border-paper/15 pt-6 md:flex-row md:items-baseline md:justify-between">
          <p className="label text-paper/60">
            © {new Date().getFullYear()} {site.name} · Hecho en Costa Rica
          </p>
          <p className="label text-paper/60">Descubrí qué vivir</p>
        </div>
      </div>
    </footer>
  );
}
