"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import {
  calculateWalletLevelFromData,
  getCreatureCountByRarity,
  getOwnedCountsByRarity,
  type Rarity,
} from "@/data/creatures.data";
import { useMemo } from "react";
import { isAddress } from "viem";
import { useReadContract } from "wagmi";

interface CollectionStatsData {
  walletLevel: {
    level: number;
    score: number;
    nextLevelScore: number | null;
    progressToNext: number;
  };
  ownedCounts: Record<Rarity, number>;
  totalCounts: Record<Rarity, number>;
  rarityStats: Array<{
    rarity: Rarity;
    owned: number;
    total: number;
  }>;
}

interface UseCollectionStatsReturn {
  stats: CollectionStatsData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useCollectionStats(walletAddress: `0x${string}`): UseCollectionStatsReturn {
  const {
    data: collectionData,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserCollection",
    args: [walletAddress],
    query: {
      enabled: isAddress(walletAddress),
    },
  });

  const stats = useMemo(() => {
    if (!collectionData) {
      return null;
    }

    // Calculate wallet level
    const walletLevel = calculateWalletLevelFromData(collectionData);

    // Get owned counts by rarity
    const ownedCounts = getOwnedCountsByRarity(collectionData);

    // Get total counts by rarity
    const totalCounts = getCreatureCountByRarity();

    // Create rarity stats array
    const rarityStats: Array<{
      rarity: Rarity;
      owned: number;
      total: number;
    }> = [
      { rarity: "deity", owned: ownedCounts.deity, total: totalCounts.deity },
      { rarity: "epic", owned: ownedCounts.epic, total: totalCounts.epic },
      { rarity: "rare", owned: ownedCounts.rare, total: totalCounts.rare },
      { rarity: "common", owned: ownedCounts.common, total: totalCounts.common },
    ];

    return {
      walletLevel,
      ownedCounts,
      totalCounts,
      rarityStats,
    };
  }, [collectionData]);

  return {
    stats,
    isLoading,
    isError,
    error,
  };
}
