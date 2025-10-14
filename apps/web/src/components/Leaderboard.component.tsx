import { env } from "@/lib/env.config";
import { type LeaderboardEntry } from "@eldritchain/common";
import Link from "next/link";
import { styles } from "./Leaderboard.styles";

async function fetchLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  if (!env.indexerApiUrl) {
    return [];
  }

  try {
    const response = await fetch(`${env.indexerApiUrl}/api/leaderboard?limit=${limit}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Failed to fetch leaderboard:", response.statusText);
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

interface LeaderboardProps {
  limit?: number;
}

export async function Leaderboard({ limit = 10 }: LeaderboardProps) {
  if (!env.indexerApiUrl) {
    return null;
  }

  const leaderboard = await fetchLeaderboard(limit);

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>🏆 Leaderboard</h2>
        <div className={styles.empty}>
          <p className={styles.emptyText}>No summoners yet!</p>
          <p className={styles.emptySubtext}>Be the first to summon a creature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🏆 Leaderboard</h2>
      <div className={styles.table.container}>
        <div className={styles.table.header}>
          <div className={styles.table.cell.rank}>Rank</div>
          <div className={styles.table.cell.address}>Summoner</div>
          <div className={styles.table.cell.count}>Deities</div>
          <div className={styles.table.cell.count}>Epics</div>
          <div className={styles.table.cell.count}>Rares</div>
          <div className={styles.table.cell.count}>Commons</div>
          <div className={styles.table.cell.total}>Total</div>
        </div>
        <div className={styles.table.body}>
          {leaderboard.map((entry, index) => (
            <Link
              key={entry.address}
              href={`/wallet/${entry.address}`}
              className={styles.table.row}
            >
              <div className={styles.table.cell.rank}>#{index + 1}</div>
              <div className={styles.table.cell.address}>
                {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
              </div>
              <div className={styles.table.cell.count}>
                <span className={styles.rarity.deity}>{entry.deityCount}</span>
              </div>
              <div className={styles.table.cell.count}>
                <span className={styles.rarity.epic}>{entry.epicCount}</span>
              </div>
              <div className={styles.table.cell.count}>
                <span className={styles.rarity.rare}>{entry.rareCount}</span>
              </div>
              <div className={styles.table.cell.count}>
                <span className={styles.rarity.common}>{entry.commonCount}</span>
              </div>
              <div className={styles.table.cell.total}>{entry.totalSummons}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
