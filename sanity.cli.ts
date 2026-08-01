import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "@/sanity/env";

/** Config para la CLI de Sanity (opcional: sanity deploy, sanity dataset, etc.). */
export default defineCliConfig({
  api: { projectId, dataset },
  autoUpdates: false,
});
