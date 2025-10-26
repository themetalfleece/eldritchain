import { Leaderboard } from "@/components/Leaderboard.component";
import Link from "next/link";
import { Suspense } from "react";
import { styles } from "./page.styles";

export default function LeaderboardPage() {
  return (
    <div className={styles.container}>
      <main className={styles.main.container}>
        <div className={styles.main.hero.container}>
          <p className={styles.main.hero.description}>
            See who has summoned the most powerful creatures across all rarities.
          </p>
        </div>

        <div className={styles.main.leaderboardSection}>
          <Suspense fallback={<LeaderboardLoading />}>
            <Leaderboard limit={100} />
          </Suspense>
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

function LeaderboardLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center py-12 text-purple-300 text-lg">Loading leaderboard...</div>
    </div>
  );
}
