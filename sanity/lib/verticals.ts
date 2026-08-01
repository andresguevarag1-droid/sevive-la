import { defineField } from "sanity";

/**
 * Lista única de verticales para los esquemas del Studio.
 * Los `value` coinciden con los slugs de `lib/site.ts` (fuente de verdad del sitio),
 * para que el color y las rutas por vertical resuelvan sin traducción.
 */
export const VERTICALES: { title: string; value: string }[] = [
  { title: "Experiencias", value: "experiencias" },
  { title: "Entretenimiento", value: "entretenimiento" },
  { title: "Cultura", value: "cultura" },
  { title: "Gastronomía", value: "gastronomia" },
  { title: "Turismo", value: "turismo" },
  { title: "Estilo de vida", value: "estilo-de-vida" },
];

/** Campo de vertical reutilizable (misma configuración en todos los tipos). */
export const verticalField = () =>
  defineField({
    name: "vertical",
    title: "Vertical",
    type: "string",
    description: "Sección a la que pertenece este contenido.",
    options: { list: VERTICALES, layout: "dropdown" },
    validation: (rule) => rule.required(),
  });
