"use client";

import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type RecentSummonEvent } from "@eldritchain/common";
import { useQuery } from "@tanstack/react-query";
import { styles } from "./RecentSummons.styles";
import { SummonCard } from "./SummonCard.component";

interface RecentSummonsClientProps {
  initialSummons: RecentSummonEvent[];
  title: string;
  limit: number;
}

export function RecentSummonsClient({ initialSummons, title, limit }: RecentSummonsClientProps) {
  const { data } = useQuery<RecentSummonEvent[]>({
    queryKey: ["recent-summons", { limit }],
    enabled: Boolean(env.indexerApiUrl),
    initialData: initialSummons,
    refetchInterval: 5_000,
    queryFn: async () => {
      const response = await fetch(getIndexerUrl(`/api/recent-summons?limit=${limit}`), {
        cache: "no-store",
      });
      if (!response.ok) {
        return initialSummons;
      }
      const json = (await response.json()) as { data?: RecentSummonEvent[] };
      return json.data ?? [];
    },
  });

  const summons = data ?? initialSummons;

  if (!summons || summons.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.empty}>
          <p className={styles.emptyText}>No recent summons yet!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {summons.map((summon, index) => (
          <SummonCard key={`${summon.transactionHash}-${index}`} summon={summon} />
        ))}
      </div>
    </div>
  );
}
