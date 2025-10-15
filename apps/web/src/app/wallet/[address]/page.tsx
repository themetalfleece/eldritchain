import { Collection } from "@/components/Collection.component";
import { CopyLinkButton } from "@/components/CopyLinkButton.component";
import { Header } from "@/components/Header.component";
import { Stats } from "@/components/Stats.component";
import { getIndexerUrl } from "@/lib/api.utils";
import { env } from "@/lib/env.config";
import { type GlobalStats } from "@eldritchain/common";
import Link from "next/link";
import { isAddress } from "viem";
import { styles } from "./page.styles";

interface WalletPageProps {
  params: Promise<{ address: string }>;
}

async function fetchUserStats(address: string): Promise<GlobalStats | null> {
  if (!env.indexerApiUrl) {
    return null;
  }

  try {
    const response = await fetch(getIndexerUrl(`/api/user/${address}`), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error("Failed to fetch user stats:", response);
      return null;
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return null;
    }

    // Convert user stats to GlobalStats format
    return {
      totalSummons: json.data.totalSummons,
      totalUsers: 1, // Single user
      common: json.data.commonCount,
      rare: json.data.rareCount,
      epic: json.data.epicCount,
      deity: json.data.deityCount,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}

export default async function WalletPage({ params }: WalletPageProps) {
  const { address } = await params;
  const isValidAddress = address && isAddress(address);

  const userStats = isValidAddress ? await fetchUserStats(address) : null;

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main.container}>
        <div className={styles.main.hero.container}>
          <h2 className={styles.main.hero.title}>Wallet Collection</h2>
          <p className={styles.main.hero.address}>
            {isValidAddress ? address : "Invalid wallet address"}
          </p>
          {isValidAddress && (
            <div className={styles.main.hero.copyButton}>
              <CopyLinkButton address={address as `0x${string}`} />
            </div>
          )}
        </div>

        {userStats && (
          <div className={styles.main.statsSection}>
            <Stats stats={userStats} title="Collection Statistics" showTotalUsers={false} />
          </div>
        )}

        <div className={styles.main.collectionSection}>
          {isValidAddress ? (
            <Collection walletAddress={address as `0x${string}`} />
          ) : (
            <div className={styles.main.error.container}>Invalid wallet address format</div>
          )}
        </div>

        <div className={styles.main.backLink.container}>
          <Link href="/" className={styles.main.backLink.link}>
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
