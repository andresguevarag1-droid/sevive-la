import type { StructureResolver } from "sanity/structure";

/**
 * Organización del Studio en español, agrupada por tipo de contenido,
 * para que redes, blog y ediciones encuentren su trabajo de un vistazo.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenido")
    .items([
      S.documentTypeListItem("cronica").title("Crónicas / Artículos"),
      S.documentTypeListItem("reel").title("Reels / Videos"),
      S.documentTypeListItem("evento").title("Agenda / Eventos"),
      S.documentTypeListItem("beneficio").title("Beneficios / Promos"),
      S.documentTypeListItem("lugar").title("Lugares"),
      S.documentTypeListItem("galeria").title("Galerías"),
    ]);
