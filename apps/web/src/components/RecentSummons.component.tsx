import { getCreature } from "@/data/creatures.data";
import { type RecentSummonEvent } from "@eldritchain/common";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { styles } from "./RecentSummons.styles";

dayjs.extend(relativeTime);

interface RecentSummonsProps {
  summons: RecentSummonEvent[];
  title?: string;
}

export function RecentSummons({ summons, title = "Recent Global Summons" }: RecentSummonsProps) {
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
        {summons.map((summon, index) => {
          const creature = getCreature(summon.creatureId);
          if (!creature) {
            return null;
          }

          return (
            <Link
              key={`${summon.transactionHash}-${index}`}
              href={`/wallet/${summon.address}`}
              className={styles.card}
            >
              <div className={styles.creatureInfo}>
                <div className={`${styles.rarity} ${styles.rarityColors[summon.rarity]}`}>
                  {summon.rarity.toUpperCase()}
                </div>
                <div className={styles.creatureName}>{creature.name}</div>
                <div className={styles.level}>Level {summon.level}</div>
              </div>
              <div className={styles.summonerInfo}>
                <div className={styles.summonerAddress}>
                  {summon.address.slice(0, 7)}...{summon.address.slice(-5)}
                </div>
                <div className={styles.timestamp}>{dayjs(summon.timestamp).fromNow()}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
