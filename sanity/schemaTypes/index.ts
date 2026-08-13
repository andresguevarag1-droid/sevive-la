import type { SchemaTypeDefinition } from "sanity";
import { cronica } from "./cronica";
import { reel } from "./reel";
import { evento } from "./evento";
import { beneficio } from "./beneficio";
import { lugar } from "./lugar";
import { galeria } from "./galeria";
import { dinamica } from "./dinamica";
import { campana } from "./campana";
import { transmision } from "./transmision";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [cronica, reel, evento, beneficio, lugar, galeria, dinamica, campana, transmision],
};
