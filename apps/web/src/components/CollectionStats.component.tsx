"use client";

import { getRarityColor } from "@/data/creatures.styles";
import { useCollectionStats } from "./CollectionStats.hooks";
import { styles } from "./CollectionStats.styles";

interface CollectionStatsProps {
  walletAddress: `0x${string}`;
}

const RARITY_LABELS = {
  common: "Commons",
  rare: "Rares",
  epic: "Epics",
  deity: "Deities",
} as const;

export function CollectionStats({ walletAddress }: CollectionStatsProps) {
  const { stats, isLoading, isError, error } = useCollectionStats(walletAddress);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Collection Statistics</h3>
        <div className={styles.loadingText}>Loading stats...</div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Collection Statistics</h3>
        <div className={styles.loadingText}>
          Error loading stats: {error?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  const { walletLevel, rarityStats } = stats;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Collection Statistics</h3>

      {/* Wallet Level Section */}
      <div className={styles.levelSection}>
        <div className={styles.levelItem}>
          <div className={styles.levelValue()}>Level {walletLevel.level}</div>
          <div className={styles.levelScore()}>
            Score: {walletLevel.score}
            {walletLevel.nextLevelScore && (
              <span className={styles.levelScoreNext()}> / {walletLevel.nextLevelScore}</span>
            )}
          </div>
          {walletLevel.nextLevelScore && (
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${walletLevel.progressToNext}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        {rarityStats.map(({ rarity, owned, total }) => (
          <div key={rarity} className={styles.statItem}>
            <div className={styles.rarityValue(getRarityColor(rarity))}>
              {owned}/{total}
            </div>
            <div className={styles.statLabel}>{RARITY_LABELS[rarity]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
