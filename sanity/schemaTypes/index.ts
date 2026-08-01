import type { SchemaTypeDefinition } from "sanity";
import { cronica } from "./cronica";
import { reel } from "./reel";
import { evento } from "./evento";
import { beneficio } from "./beneficio";
import { lugar } from "./lugar";
import { galeria } from "./galeria";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [cronica, reel, evento, beneficio, lugar, galeria],
};
