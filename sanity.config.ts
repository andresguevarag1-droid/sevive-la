"use client";

/**
 * Configuración del Sanity Studio embebido en /studio.
 * Contenido editorial del cliente — se edita en español, sin ayuda técnica.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schema } from "@/sanity/schemaTypes";
import { structure } from "@/sanity/structure";

export default defineConfig({
  basePath: "/studio",
  title: "SeViveLa · Contenido",
  projectId,
  dataset,
  schema,
  plugins: [structureTool({ structure })],
  // Sanity gestiona la sesión del editor con su propia cuenta (login por invitación).
});

export { apiVersion };
