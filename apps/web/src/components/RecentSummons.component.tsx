import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type RecentSummonEvent } from "@eldritchain/common";
import { RecentSummonsClient } from "./RecentSummonsClient.component";

async function fetchRecentSummons(limit: number): Promise<RecentSummonEvent[]> {
  if (!env.indexerApiUrl) {
    return [];
  }

  try {
    const response = await fetch(getIndexerUrl(`/api/recent-summons?limit=${limit}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch recent summons:", response);
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching recent summons:", error);
    return [];
  }
}

interface RecentSummonsProps {
  title?: string;
  limit?: number;
}

export async function RecentSummons({
  title = "Recent Global Summons",
  limit = 6,
}: RecentSummonsProps) {
  if (!env.indexerApiUrl) {
    return <div className={"w-full"}>{/* Hidden when no API URL; nothing to show */}</div>;
  }

  const initialSummons = await fetchRecentSummons(limit);
  return <RecentSummonsClient initialSummons={initialSummons} title={title} limit={limit} />;
}
