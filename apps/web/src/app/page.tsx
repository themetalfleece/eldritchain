"use client";

import { Collection } from "@/components/Collection.component";
import { SummonButton } from "@/components/SummonButton.component";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { styles } from "./page.styles";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSummonComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header.container}>
        <div className={styles.header.inner}>
          <h1 className={styles.header.title}>Eldrichain</h1>
          <ConnectButton />
        </div>
      </header>

      <main className={styles.main.container}>
        <div className={styles.main.hero.container}>
          <h2 className={styles.main.hero.title}>Daily Creature Summoning</h2>
          <p className={styles.main.hero.description}>
            Summon a random creature once per day. Collect common animals, rare predators, epic
            Lovecraftian monsters, and legendary cosmic deities.
          </p>
        </div>

        <div className={styles.main.summonSection}>
          <SummonButton onSummonComplete={handleSummonComplete} />
        </div>

        <div className={styles.main.collectionSection}>
          <Collection refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className={styles.footer.container}>
        <p>Eldrichain - A decentralized creature collection game</p>
      </footer>
    </div>
  );
}
