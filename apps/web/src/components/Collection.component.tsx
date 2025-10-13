"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { getCreature } from "@/data/creatures.data";
import { useAccount, useReadContract } from "wagmi";
import { styles } from "./Collection.styles";
import { CreatureCard } from "./CreatureCard.component";

interface CollectionProps {
  refreshTrigger?: number;
}

export function Collection({ refreshTrigger }: CollectionProps) {
  const { address, isConnected } = useAccount();

  const {
    data: collectionData,
    isLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserCollection",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Refetch when refreshTrigger changes
  if (refreshTrigger !== undefined) {
    refetch();
  }

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading your collection...</div>
      </div>
    );
  }

  const [creatureIds, levels] = collectionData || [[], []];

  if (!creatureIds || creatureIds.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyText}>
          You haven&apos;t summoned any creatures yet.
          <br />
          Press the summon button to begin your collection!
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Collection ({creatureIds.length} creatures)</h2>
      <div className={styles.grid}>
        {creatureIds.map((id, index) => {
          const creature = getCreature(Number(id));
          if (!creature) {
            return null;
          }

          return (
            <CreatureCard key={id.toString()} creature={creature} level={Number(levels[index])} />
          );
        })}
      </div>
    </div>
  );
}
