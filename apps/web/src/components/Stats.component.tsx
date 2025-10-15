import { type GlobalStats } from "@eldritchain/common";
import { styles } from "./Stats.styles";

interface StatsProps {
  stats: GlobalStats;
  title?: string;
  showTotalUsers?: boolean;
}

export function Stats({ stats, title = "Statistics", showTotalUsers = true }: StatsProps) {
  const gridClass = showTotalUsers ? styles.gridWithUsers : styles.gridWithoutUsers;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={gridClass}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{stats.totalSummons}</div>
          <div className={styles.statLabel}>Total Summons</div>
        </div>
        {showTotalUsers && (
          <div className={styles.statItem}>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
        )}
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.rarity.deity}`}>{stats.deity}</div>
          <div className={styles.statLabel}>Deities</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.rarity.epic}`}>{stats.epic}</div>
          <div className={styles.statLabel}>Epics</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.rarity.rare}`}>{stats.rare}</div>
          <div className={styles.statLabel}>Rares</div>
        </div>
        <div className={styles.statItem}>
          <div className={`${styles.statValue} ${styles.rarity.common}`}>{stats.common}</div>
          <div className={styles.statLabel}>Commons</div>
        </div>
      </div>
    </div>
  );
}
