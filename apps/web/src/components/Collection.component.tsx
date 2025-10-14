"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { getCreature } from "@/data/creatures.data";
import { isAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { styles } from "./Collection.styles";
import { CreatureCard } from "./CreatureCard.component";

interface CollectionProps {
  /** Trigger number to force refetch of collection data */
  refreshTrigger?: number;
  /** Wallet address to query collection for. If not provided, uses connected wallet */
  walletAddress?: `0x${string}`;
  /** If true, only shows collection when user's own wallet is connected. If false, shows any wallet's collection */
  showOwnCollectionOnly?: boolean;
}

export function Collection({
  refreshTrigger,
  walletAddress,
  showOwnCollectionOnly = false,
}: CollectionProps) {
  const { address: connectedAddress, isConnected } = useAccount();

  // Use provided walletAddress or fallback to connected address
  const addressToQuery = walletAddress || connectedAddress;

  // Determine if we're viewing our own collection or someone else's
  const isOwnCollection = connectedAddress && addressToQuery === connectedAddress;

  const {
    data: collectionData,
    isLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserCollection",
    args: addressToQuery ? [addressToQuery] : undefined,
    query: {
      enabled: !!addressToQuery && isAddress(addressToQuery),
    },
  });

  // Refetch when refreshTrigger changes
  if (refreshTrigger !== undefined) {
    refetch();
  }

  // Only hide if showOwnCollectionOnly is true and no wallet is connected
  if (showOwnCollectionOnly && !isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading collection...</div>
      </div>
    );
  }

  const [creatureIds, levels] = collectionData || [[], []];

  if (!creatureIds || creatureIds.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyText}>
          {isOwnCollection ? (
            <>
              You haven&apos;t summoned any creatures yet.
              <br />
              Press the summon button to begin your collection!
            </>
          ) : (
            <>This wallet hasn&apos;t summoned any creatures yet.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {isOwnCollection ? "Your" : "Wallet"} Collection ({creatureIds.length} creatures)
      </h2>
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
