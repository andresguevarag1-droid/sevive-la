import type { StructureResolver } from "sanity/structure";

/**
 * Organización del Studio en español. Cada tipo con bandejas filtradas
 * (Próximos/Pasados, Vigentes/Vencidos, Programadas…) para que el equipo
 * vea el estado del contenido de un vistazo, sin abrir documento por
 * documento. Las bandejas son vistas: el documento es el mismo.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Contenido")
    .items([
      S.listItem()
        .title("Crónicas / Artículos")
        .child(
          S.list()
            .title("Crónicas")
            .items([
              S.listItem()
                .title("Todas")
                .child(S.documentTypeList("cronica").title("Todas")),
              S.listItem()
                .title("⭐ En el carrusel de portada")
                .child(
                  S.documentList()
                    .title("En portada (máx. 5 visibles)")
                    .filter('_type == "cronica" && esPortada == true')
                    .defaultOrdering([{ field: "fecha", direction: "desc" }])
                ),
              S.listItem()
                .title("✦ Destacadas en el home")
                .child(
                  S.documentList()
                    .title("Destacadas")
                    .filter('_type == "cronica" && destacada == true')
                    .defaultOrdering([{ field: "fecha", direction: "desc" }])
                ),
              S.listItem()
                .title("🕑 Programadas (fecha futura)")
                .child(
                  S.documentList()
                    .title("Se publican solas al llegar su fecha")
                    .filter('_type == "cronica" && fecha > now()')
                    .defaultOrdering([{ field: "fecha", direction: "asc" }])
                ),
              S.listItem()
                .title("⚠ Sin imagen de portada")
                .child(
                  S.documentList()
                    .title("Sin imagen")
                    .filter('_type == "cronica" && !defined(imagen.asset)')
                ),
            ])
        ),
      S.listItem()
        .title("Agenda / Eventos")
        .child(
          S.list()
            .title("Agenda")
            .items([
              S.listItem()
                .title("📅 Próximos")
                .child(
                  S.documentList()
                    .title("Próximos")
                    .filter('_type == "evento" && inicio >= now()')
                    .defaultOrdering([{ field: "inicio", direction: "asc" }])
                ),
              S.listItem()
                .title("✔ Pasados")
                .child(
                  S.documentList()
                    .title("Pasados (siguen captando interés)")
                    .filter('_type == "evento" && inicio < now()')
                    .defaultOrdering([{ field: "inicio", direction: "desc" }])
                ),
              S.listItem()
                .title("Todos")
                .child(S.documentTypeList("evento").title("Todos")),
            ])
        ),
      S.listItem()
        .title("Reels / Videos")
        .child(
          S.list()
            .title("Reels")
            .items([
              S.listItem()
                .title("Todos")
                .child(S.documentTypeList("reel").title("Todos")),
              S.listItem()
                .title("⚠ Sin enlace de video")
                .child(
                  S.documentList()
                    .title("Tarjetas muertas: pegales su URL")
                    .filter('_type == "reel" && !defined(videoUrl)')
                ),
            ])
        ),
      S.listItem()
        .title("Cuponera")
        .child(
          S.list()
            .title("Cuponera")
            .items([
              S.listItem()
                .title("🟢 Vigentes")
                .child(
                  S.documentList()
                    .title("Vigentes (visibles en el sitio)")
                    .filter(
                      // vigencia es fecha (sin hora): el cupón vale TODO su
                      // último día EN COSTA RICA (UTC-6, sin horario de verano).
                      '_type == "beneficio" && (!defined(vigencia) || dateTime(vigencia + "T23:59:59-06:00") >= dateTime(now()))'
                    )
                    .defaultOrdering([{ field: "orden", direction: "asc" }])
                ),
              S.listItem()
                .title("🔴 Vencidos")
                .child(
                  S.documentList()
                    .title("Vencidos (ya no se muestran)")
                    .filter(
                      '_type == "beneficio" && defined(vigencia) && dateTime(vigencia + "T23:59:59-06:00") < dateTime(now())'
                    )
                    .defaultOrdering([{ field: "vigencia", direction: "desc" }])
                ),
              S.listItem()
                .title("Todos")
                .child(S.documentTypeList("beneficio").title("Todos")),
            ])
        ),
      S.documentTypeListItem("campana").title("Campañas (hero de home)"),
      S.documentTypeListItem("transmision").title("🔴 En vivo (transmisiones)"),
      S.listItem()
        .title("Dinámicas / Giveaways")
        .child(
          S.list()
            .title("Dinámicas")
            .items([
              S.listItem()
                .title("🟢 Abiertas")
                .child(
                  S.documentList()
                    .title("Abiertas (recibiendo participaciones)")
                    .filter('_type == "dinamica" && cierre >= now() && activa != false')
                    .defaultOrdering([{ field: "cierre", direction: "asc" }])
                ),
              S.listItem()
                .title("🔴 Cerradas o pausadas")
                .child(
                  S.documentList()
                    .title("Cerradas o pausadas")
                    .filter('_type == "dinamica" && (cierre < now() || activa == false)')
                    .defaultOrdering([{ field: "cierre", direction: "desc" }])
                ),
              S.listItem()
                .title("Todas")
                .child(S.documentTypeList("dinamica").title("Todas")),
            ])
        ),
      S.documentTypeListItem("lugar").title("Lugares"),
      S.documentTypeListItem("galeria").title("Galerías"),
    ]);
