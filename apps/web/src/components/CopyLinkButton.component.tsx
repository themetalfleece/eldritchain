"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { styles } from "./CopyLinkButton.styles";

interface CopyLinkButtonProps {
  address: `0x${string}`;
}

export function CopyLinkButton({ address }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

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
      {copied ? "✓ Copied to clipboard!" : "📤 Copy Collection Link"}
    </button>
  );
}
