import { type Rarity } from "@eldritchain/common";
import creaturesJson from "./creatures.json";

export type { Rarity };

export interface Creature {
  id: number;
  name: string;
  rarity: Rarity;
  description: string;
}

// Wallet Level Scoring System (based on summon rarity percentages)
// Common: 70%, Rare: 25%, Epic: 4.5%, Deity: 0.5%
// Scores reflect relative rarity with higher multipliers for rarer creatures
export const RARITY_SCORES = {
  common: 1, // Base score
  rare: 5, // ~2.8x rarer than common
  epic: 30, // ~15.4x rarer than common
  deity: 400, // ~140x rarer than common
} as const;

// Level thresholds (computed using formula: level(n) = 5 * (n-1) * n / 2)
export function getLevelThreshold(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return Math.floor((5 * (level - 1) * level) / 2);
}

// Helper to get level from score (optimized with binary search)
export function getLevelFromScore(score: number): number {
  if (score < 0) {
    return 1;
  }

  let left = 1;
  let right = 100; // Reasonable max level

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const threshold = getLevelThreshold(mid + 1);

    if (score < threshold) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}

export const creatures: Creature[] = creaturesJson as Creature[];

export function getCreature(id: number): Creature | undefined {
  return creatures.find((c) => c.id === id);
}

// Helper to get all creatures by rarity
export function getCreaturesByRarity(rarity: Rarity): Creature[] {
  return creatures.filter((c) => c.rarity === rarity);
}

// Helper to get creature count by rarity
export function getCreatureCountByRarity(): Record<Rarity, number> {
  return creatures.reduce(
    (counts, creature) => {
      counts[creature.rarity]++;
      return counts;
    },
    {
      common: 0,
      rare: 0,
      epic: 0,
      deity: 0,
    }
  );
}

// Convert contract collection data to creature collection object
export function convertCollectionData(
  collectionData: [bigint[], bigint[]] | undefined
): Record<number, number> {
  if (!collectionData) {
    return {};
  }

  const [creatureIds, levels] = collectionData;
  return creatureIds.reduce(
    (acc, id, index) => {
      acc[Number(id)] = Number(levels[index] || 1);
      return acc;
    },
    {} as Record<number, number>
  );
}

// Count owned creatures by rarity from collection data
export function getOwnedCountsByRarity(
  collectionData: [bigint[], bigint[]] | undefined
): Record<Rarity, number> {
  if (!collectionData) {
    return { common: 0, rare: 0, epic: 0, deity: 0 };
  }

  const [creatureIds] = collectionData;
  return creatureIds.reduce(
    (counts, id) => {
      const creature = getCreature(Number(id));
      if (creature) {
        counts[creature.rarity]++;
      }
      return counts;
    },
    {
      common: 0,
      rare: 0,
      epic: 0,
      deity: 0,
    }
  );
}

// Calculate wallet level from collection data
export function calculateWalletLevelFromData(collectionData: [bigint[], bigint[]] | undefined) {
  const creatureCollection = convertCollectionData(collectionData);
  return calculateWalletLevel(creatureCollection);
}

// Calculate wallet level based on creature collection
export function calculateWalletLevel(creatureCollection: Record<number, number>): {
  level: number;
  score: number;
  nextLevelScore: number | null;
  progressToNext: number;
} {
  // Calculate total score (rarity score * creature level)
  const score = Object.entries(creatureCollection).reduce((total, [id, level]) => {
    const creature = getCreature(Number(id));
    const creatureLevel = level || 1; // Default to level 1 if not provided
    if (creature) {
      return total + RARITY_SCORES[creature.rarity] * creatureLevel;
    }
    return total;
  }, 0);

  // Find current level
  const currentLevel = getLevelFromScore(score);
  const nextLevelScore = getLevelThreshold(currentLevel + 1);
  const currentLevelThreshold = getLevelThreshold(currentLevel);

  // Calculate progress to next level
  const progressToNext = nextLevelScore
    ? ((score - currentLevelThreshold) / (nextLevelScore - currentLevelThreshold)) * 100
    : 100;

  return {
    level: currentLevel,
    score,
    nextLevelScore,
    progressToNext: Math.min(100, Math.max(0, progressToNext)),
  };
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
