import { GlobalStatsClient } from "@/components/GlobalStatsClient.component";
import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type GlobalStats } from "@eldritchain/common";

async function fetchGlobalStats(): Promise<GlobalStats | null> {
  if (!env.indexerApiUrl) {
    return null;
  }

  try {
    const response = await fetch(getIndexerUrl("/api/stats"), {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Failed to fetch global stats:", response);
      return null;
    }
    const json = await response.json();
    return (json.data as GlobalStats) || null;
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return null;
  }
}

export async function GlobalStats() {
  if (!env.indexerApiUrl) {
    return null;
  }

  const initialStats = await fetchGlobalStats();
  return <GlobalStatsClient initialStats={initialStats} />;
}
