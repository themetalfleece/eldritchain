import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type LeaderboardEntry } from "@eldritchain/common";
import { LeaderboardClient } from "./LeaderboardClient.component";

async function fetchLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  if (!env.indexerApiUrl) {
    return [];
  }

  try {
    const response = await fetch(getIndexerUrl(`/api/leaderboard?limit=${limit}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch leaderboard:", response);
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

  const initialLeaderboard = await fetchLeaderboard(limit);
  return <LeaderboardClient initialLeaderboard={initialLeaderboard} limit={limit} />;
}
