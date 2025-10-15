import { styles } from "./Footer.styles";

export function Footer() {
  return (
    <footer className={styles.container}>
      <p>Eldritchain - A decentralized creature collection game</p>
      <p className={styles.github}>
        <a
          href="https://github.com/themetalfleece/eldritchain"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
        >
          View on GitHub
        </a>
      </p>
    </footer>
  );
}
