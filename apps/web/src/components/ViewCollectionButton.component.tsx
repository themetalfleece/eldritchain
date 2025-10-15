"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { styles } from "./ViewCollectionButton.styles";

export function ViewCollectionButton() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  if (!isConnected || !address) {
    return null;
  }

  const handleNavigateToWallet = () => {
    router.push(`/wallet/${address}`);
  };

  return (
    <button
      onClick={handleNavigateToWallet}
      className={clsx(styles.button.base, styles.button.default)}
    >
      🏠 View My Collection
    </button>
  );
}
