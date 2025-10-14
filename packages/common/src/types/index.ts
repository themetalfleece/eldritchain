export type { Rarity } from "../constants/creature-ranges";

/** User collection entry */
export interface UserCollection {
  address: string;
  creatureIds: number[];
  levels: number[];
}

/** Summon event data */
export interface SummonEvent {
  summoner: string;
  creatureId: number;
  level: number;
  timestamp: number;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  address: string;
  totalSummons: number;
  deityCount: number;
  epicCount: number;
  rareCount: number;
  commonCount: number;
  lastSummonTime: Date;
  rank?: number;
}
