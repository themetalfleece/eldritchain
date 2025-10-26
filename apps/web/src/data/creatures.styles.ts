import { type Rarity } from "@eldritchain/common";

export function getRarityColor(rarity: Rarity): string {
  if (rarity === "common") {
    return "text-gray-400 border-gray-400";
  }
  if (rarity === "rare") {
    return "text-blue-400 border-blue-400";
  }
  if (rarity === "epic") {
    return "text-purple-400 border-purple-400";
  }
  if (rarity === "deity") {
    return "text-yellow-400 border-yellow-400";
  }

  // Fallback for unknown rarity
  return "text-gray-400 border-gray-400";
}

export function getRarityBgColor(rarity: Rarity): string {
  if (rarity === "common") {
    return "bg-gray-900/50";
  }
  if (rarity === "rare") {
    return "bg-blue-900/30";
  }
  if (rarity === "epic") {
    return "bg-purple-900/30";
  }
  if (rarity === "deity") {
    return "bg-yellow-900/30";
  }

  // Fallback for unknown rarity
  return "bg-gray-900/50";
}
