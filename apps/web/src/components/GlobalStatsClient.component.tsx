"use client";

import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type GlobalStats } from "@eldritchain/common";
import { useQuery } from "@tanstack/react-query";
import { Stats } from "./Stats.component";

interface GlobalStatsClientProps {
  initialStats: GlobalStats | null;
}

export function GlobalStatsClient({ initialStats }: GlobalStatsClientProps) {
  const { data } = useQuery<GlobalStats | undefined>({
    queryKey: ["global-stats"],
    enabled: Boolean(env.indexerApiUrl),
    initialData: initialStats ?? undefined,
    refetchInterval: 5_000,
    queryFn: async () => {
      const response = await fetch(getIndexerUrl("/api/stats"), { cache: "no-store" });
      if (!response.ok) {
        return initialStats ?? undefined;
      }
      const json = (await response.json()) as { data?: GlobalStats };
      return json.data ?? initialStats ?? undefined;
    },
  });

  const stats = data ?? initialStats ?? null;
  if (!stats) {
    return <div className="w-full text-center py-6 text-purple-300">Loading stats...</div>;
  }

  return <Stats stats={stats} />;
}
