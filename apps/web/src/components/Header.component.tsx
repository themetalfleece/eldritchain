import Link from "next/link";
import { ConnectButtonClient } from "./ConnectButtonClient.component";
import { styles } from "./Header.styles";

export function Header() {
  return (
    <header className={styles.container}>
      <div className={styles.inner}>
        <Link href="/">
          <h1 className={styles.title}>Eldritchain</h1>
        </Link>
        <ConnectButtonClient />
      </div>
    </header>
  );
}
