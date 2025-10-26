import { type Rarity } from "@eldritchain/common";
import creaturesJson from "./creatures.json";

export type { Rarity };

export interface Creature {
  id: number;
  name: string;
  rarity: Rarity;
  description: string;
}

export const creatures: Creature[] = creaturesJson as Creature[];

export function getCreature(id: number): Creature | undefined {
  return creatures.find((c) => c.id === id);
}

// Helper to get all creatures by rarity
export function getCreaturesByRarity(rarity: Rarity): Creature[] {
  return creatures.filter((c) => c.rarity === rarity);
}

// Helper to get highest ID per rarity
export function getHighestIdByRarity(): {
  common: number;
  rare: number;
  epic: number;
  deity: number;
} {
  const commons = getCreaturesByRarity("common");
  const rares = getCreaturesByRarity("rare");
  const epics = getCreaturesByRarity("epic");
  const deities = getCreaturesByRarity("deity");

  return {
    common: commons.length > 0 ? Math.max(...commons.map((c) => c.id)) : -1,
    rare: rares.length > 0 ? Math.max(...rares.map((c) => c.id)) : 999,
    epic: epics.length > 0 ? Math.max(...epics.map((c) => c.id)) : 1499,
    deity: deities.length > 0 ? Math.max(...deities.map((c) => c.id)) : 1599,
  };
}
