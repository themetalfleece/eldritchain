import { GlobalStats } from "@/components/GlobalStats.component";
import { InteractiveSection } from "@/components/InteractiveSection.component";
import { Leaderboard } from "@/components/Leaderboard.component";
import { RecentSummons } from "@/components/RecentSummons.component";

import Link from "next/link";
import { Suspense } from "react";
import { styles } from "./page.styles";

export default async function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main.container}>
        <div className={styles.main.hero.container}>
          <h2 className={styles.main.hero.title}>Daily Creature Summoning</h2>
          <p className={styles.main.hero.description}>
            Summon a random creature once per day. Collect common animals, rare predators, epic
            Lovecraftian monsters, and legendary cosmic deities.
          </p>
          <div className={styles.main.hero.note}>
            <p className={styles.main.hero.noteText}>
              💎 <strong>Decentralized & On-Chain:</strong> All creature data is stored on the
              blockchain.
              <br />
              Gas fees paid in POL (Polygon&apos;s native token).
              <br />
              Your collection is truly yours!
            </p>
          </div>
        </div>

        <div className={styles.main.statsSection}>
          <GlobalStats />
        </div>

        <InteractiveSection summonSectionStyles={styles.main.summonSection} />

        <div className={styles.main.recentSummonsSection}>
          <RecentSummons />
        </div>

        <div className={styles.main.leaderboardSection}>
          <Suspense fallback={<LeaderboardLoading />}>
            <Leaderboard limit={10} />
          </Suspense>
          <div className="text-center mt-6">
            <Link
              href="/leaderboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Show More →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function LeaderboardLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
        🏆 Leaderboard
      </h2>
      <div className="text-center py-12 text-purple-300 text-lg">Loading leaderboard...</div>
    </div>
  );
}
