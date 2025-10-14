"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { styles } from "./ShareCollectionButton.styles";

export function ShareCollectionButton() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  if (!isConnected || !address) {
    return null;
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/wallet/${address}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(styles.button.base, copied ? styles.button.copied : styles.button.default)}
    >
      {copied ? "✓ Copied to clipboard!" : "📤 Share Your Collection"}
    </button>
  );
}
