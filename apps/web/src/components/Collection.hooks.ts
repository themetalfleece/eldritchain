"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { getCreature, type Rarity } from "@/data/creatures.data";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { isAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";

interface CreatureWithLevel {
  id: number;
  level: number;
  creature: NonNullable<ReturnType<typeof getCreature>>;
}

// Type guard to ensure creature is defined
function hasCreature(item: {
  id: number;
  level: number;
  creature: ReturnType<typeof getCreature>;
}): item is CreatureWithLevel {
  return item.creature !== undefined;
}

interface UseCollectionReturn {
  sortedCreatures: CreatureWithLevel[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  creatureCount: number;
  isOwnCollection: boolean;
  invalidateCollection: () => Promise<void>;
}

export function useCollection({
  walletAddress,
}: {
  walletAddress?: `0x${string}`;
}): UseCollectionReturn {
  const { address: connectedAddress } = useAccount();
  const queryClient = useQueryClient();

  // Use provided walletAddress or fallback to connected address
  const addressToQuery = walletAddress || connectedAddress;

  // Determine if we're viewing our own collection or someone else's
  const isOwnCollection = connectedAddress && addressToQuery === connectedAddress;

  const {
    data: collectionData,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserCollection",
    args: addressToQuery ? [addressToQuery] : undefined,
    query: {
      enabled: !!addressToQuery && isAddress(addressToQuery),
    },
  });

  // Function to invalidate collection queries
  const invalidateCollection = async () => {
    await queryClient.invalidateQueries({
      queryKey: [
        "readContract",
        {
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getUserCollection",
          args: addressToQuery ? [addressToQuery] : undefined,
        },
      ],
    });
  };

  const sortedCreatures = useMemo(() => {
    if (!collectionData) {
      return [];
    }

    const [creatureIds, levels] = collectionData;

    // Sort creatures by rarity (rarer first), then by level (descending), then by ID (ascending)
    const rarityOrder: Record<Rarity, number> = {
      deity: 4,
      epic: 3,
      rare: 2,
      common: 1,
    };

    return creatureIds
      .map((id, index) => ({
        id: Number(id),
        level: Number(levels[index]),
        creature: getCreature(Number(id)),
      }))
      .filter(hasCreature) // Remove any invalid creatures with type guard
      .sort((a, b) => {
        const rarityA = rarityOrder[a.creature.rarity];
        const rarityB = rarityOrder[b.creature.rarity];

        // First sort by rarity (higher number = rarer)
        if (rarityA !== rarityB) {
          return rarityB - rarityA;
        }

        // Then sort by level (descending)
        if (a.level !== b.level) {
          return b.level - a.level;
        }

        // Finally sort by ID (ascending)
        return a.id - b.id;
      });
  }, [collectionData]);

  const creatureCount = useMemo(() => {
    return collectionData ? collectionData[0].length : 0;
  }, [collectionData]);

  return {
    sortedCreatures,
    isLoading,
    isError,
    error,
    creatureCount,
    isOwnCollection: !!isOwnCollection,
    invalidateCollection,
  };
}
