import { Creature } from "@/data/creatures.data";
import { getRarityBgColor, getRarityColor } from "@/data/creatures.styles";
import { styles } from "./CreatureCard.styles";

interface CreatureCardProps {
  creature: Creature;
  level: number;
}

export function CreatureCard({ creature, level }: CreatureCardProps) {
  const rarityColor = getRarityColor(creature.rarity);
  const rarityBg = getRarityBgColor(creature.rarity);

  return (
    <div className={`${rarityBg} ${styles.card} ${rarityColor.split(" ")[1]}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{creature.name}</h3>
        <span className={`${rarityColor} ${styles.rarityBadge}`}>{creature.rarity}</span>
      </div>
      <p className={styles.description}>{creature.description}</p>
      <div className={styles.footer}>
        <span className={styles.idLabel}>ID: {creature.id}</span>
        <span className={styles.levelLabel}>Level {level}</span>
      </div>
    </div>
  );
}
