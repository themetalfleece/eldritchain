import { Collection } from "@/components/Collection.component";
import { ConnectButtonClient } from "@/components/ConnectButtonClient.component";
import Link from "next/link";
import { isAddress } from "viem";
import { styles } from "./page.styles";

interface WalletPageProps {
  params: Promise<{ address: string }>;
}

export default async function WalletPage({ params }: WalletPageProps) {
  const { address } = await params;
  const isValidAddress = address && isAddress(address);

  return (
    <div className={styles.container}>
      <header className={styles.header.container}>
        <div className={styles.header.inner}>
          <Link href="/">
            <h1 className={styles.header.title}>Eldritchain</h1>
          </Link>
          <ConnectButtonClient />
        </div>
      </header>

      <main className={styles.main.container}>
        <div className={styles.main.hero.container}>
          <h2 className={styles.main.hero.title}>Wallet Collection</h2>
          <p className={styles.main.hero.address}>
            {isValidAddress ? address : "Invalid wallet address"}
          </p>
        </div>

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

      <footer className={styles.footer.container}>
        <p>Eldritchain - A decentralized creature collection game</p>
      </footer>
    </div>
  );
}
