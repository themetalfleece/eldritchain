"use client";

import { useCollection } from "./Collection.hooks";
import { styles } from "./Collection.styles";
import { CreatureCard } from "./CreatureCard.component";

interface CollectionProps {
  /** Wallet address to query collection for. If not provided, uses connected wallet */
  walletAddress?: `0x${string}`;
}

export function Collection({ walletAddress }: CollectionProps) {
  const { sortedCreatures, isLoading, isError, error, creatureCount, isOwnCollection } =
    useCollection({
      walletAddress,
    });

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading collection...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>
          Error loading collection: {error?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  if (creatureCount === 0) {
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
      <h2 className={styles.title}>{isOwnCollection ? "Your" : "Wallet"} Collection</h2>
      <div className={styles.grid}>
        {sortedCreatures.map(({ id, level, creature }) => (
          <CreatureCard key={id.toString()} creature={creature} level={level} />
        ))}
      </div>
    </div>
  );
}
