"use client";

import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type LeaderboardEntry } from "@eldritchain/common";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { styles } from "./Leaderboard.styles";

interface LeaderboardClientProps {
  limit: number;
  initialLeaderboard: LeaderboardEntry[];
}

export function LeaderboardClient({ limit, initialLeaderboard }: LeaderboardClientProps) {
  const { data } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", { limit }],
    enabled: Boolean(env.indexerApiUrl),
    initialData: initialLeaderboard,
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await fetch(getIndexerUrl(`/api/leaderboard?limit=${limit}`), {
        cache: "no-store",
      });
      if (!response.ok) {
        return initialLeaderboard;
      }
      const json = (await response.json()) as { data?: LeaderboardEntry[] };
      return json.data ?? [];
    },
  });

  const leaderboard = data ?? initialLeaderboard;

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
              <div className={styles.table.cell.address} title={entry.address}>
                <span className={styles.table.cell.addressDesktop}>
                  {entry.address.slice(0, 7)}...{entry.address.slice(-5)}
                </span>
                <span className={styles.table.cell.addressMobile}>
                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                </span>
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
