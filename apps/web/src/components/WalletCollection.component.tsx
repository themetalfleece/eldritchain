"use client";

import { Collection } from "@/components/Collection.component";
import { CollectionStats } from "@/components/CollectionStats.component";
import { CopyLinkButton } from "@/components/CopyLinkButton.component";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAddress } from "viem";
import { styles } from "./WalletCollection.styles";

export function WalletCollection() {
  const params = useParams();
  const address = params?.address as string | undefined;
  const isValidAddress = address && typeof address === "string" && isAddress(address);

  if (!address) {
    return (
      <main className={styles.main.container}>
        <div className={styles.main.error.container}>Loading...</div>
      </main>
    );
  }

  return (
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

      {isValidAddress && (
        <div className={styles.main.statsSection}>
          <CollectionStats walletAddress={address as `0x${string}`} />
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
  );
}
