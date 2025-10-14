/** Creature ID range constants - Single source of truth */

export const creatureRanges = {
  common: {
    base: 0,
    max: 999,
    namespaceSize: 1000,
  },
  rare: {
    base: 1000,
    max: 1499,
    namespaceSize: 500,
  },
  epic: {
    base: 1500,
    max: 1599,
    namespaceSize: 100,
  },
  deity: {
    base: 1600,
    max: 1649,
    namespaceSize: 50,
  },
} as const;

/** All rarity tiers */
export const rarityTiers = ["common", "rare", "epic", "deity"] as const;

/** Rarity type */
export type Rarity = (typeof rarityTiers)[number];

/** Determine creature rarity based on ID */
export function getCreatureRarity(creatureId: number): Rarity {
  if (creatureId >= creatureRanges.deity.base && creatureId <= creatureRanges.deity.max) {
    return "deity";
  }
  if (creatureId >= creatureRanges.epic.base && creatureId <= creatureRanges.epic.max) {
    return "epic";
  }
  if (creatureId >= creatureRanges.rare.base && creatureId <= creatureRanges.rare.max) {
    return "rare";
  }
  return "common";
}

/** Check if a creature ID is valid */
export function isValidCreatureId(creatureId: number): boolean {
  return (
    (creatureId >= creatureRanges.common.base && creatureId <= creatureRanges.common.max) ||
    (creatureId >= creatureRanges.rare.base && creatureId <= creatureRanges.rare.max) ||
    (creatureId >= creatureRanges.epic.base && creatureId <= creatureRanges.epic.max) ||
    (creatureId >= creatureRanges.deity.base && creatureId <= creatureRanges.deity.max)
  );
}

/** Get rarity drop rate percentage */
export function getRarityDropRate(rarity: Rarity): number {
  const rates = {
    common: 70,
    rare: 25,
    epic: 4.5,
    deity: 0.5,
  };
  return rates[rarity];
}
