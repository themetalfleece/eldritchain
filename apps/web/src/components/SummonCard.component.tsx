import { getCreature } from "@/data/creatures.data";
import { getRarityBgColor, getRarityColor } from "@/data/creatures.styles";
import { type RecentSummonEvent } from "@eldritchain/common";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { styles } from "./RecentSummons.styles";

dayjs.extend(relativeTime);

export function SummonCard({ summon }: { summon: RecentSummonEvent }) {
  const creature = getCreature(summon.creatureId);
  if (!creature) {
    return null;
  }

  return (
    <Link href={`/wallet/${summon.address}`} className={`${styles.card} border ${getRarityColor(summon.rarity)}`}>
      <div className={styles.creatureInfo}>
        <div className={`${styles.rarity} ${getRarityBgColor(summon.rarity)} ${getRarityColor(summon.rarity)}`}>
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
}
