import { defineField } from "sanity";

/**
 * Lista única de verticales para los esquemas del Studio.
 * Los `value` coinciden con los slugs de `lib/site.ts` (fuente de verdad del sitio),
 * para que el color y las rutas por vertical resuelvan sin traducción.
 */
export const VERTICALES: { title: string; value: string }[] = [
  { title: "Entretenimiento", value: "entretenimiento" },
  { title: "Cultura", value: "cultura" },
  { title: "Experiencias", value: "experiencias" },
  { title: "Ocio", value: "ocio" },
  { title: "Estilo de vida", value: "estilo-de-vida" },
  // Ocultas del sitio por ahora (el contenido existente sigue siendo válido):
  { title: "Gastronomía (oculta)", value: "gastronomia" },
  { title: "Turismo (oculta)", value: "turismo" },
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
