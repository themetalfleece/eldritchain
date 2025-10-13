"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { styles } from "./SummonButton.styles";

interface SummonButtonProps {
  onSummonComplete?: (creatureId: bigint) => void;
}

export function SummonButton({ onSummonComplete }: SummonButtonProps) {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { data: canSummon } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "canSummon",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { data: nextSummonTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getNextSummonTime",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !canSummon,
      refetchInterval: 1000,
    },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!nextSummonTime || canSummon) {
      setTimeLeft("");
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const nextTime = Number(nextSummonTime);
      const diff = nextTime - now;

      if (diff <= 0) {
        setTimeLeft("");
        return;
      }

      // Format as UTC time for clarity
      const date = new Date(nextTime * 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      const utcString = date.toUTCString().split(" ").slice(0, 5).join(" ");
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s (${utcString})`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextSummonTime, canSummon]);

  useEffect(() => {
    if (isSuccess && hash && onSummonComplete) {
      setTimeout(() => {
        onSummonComplete(0n);
      }, 1000);
    }
  }, [isSuccess, hash, onSummonComplete]);

  const handleSummon = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "summon",
    });
  };

  if (!isConnected) {
    return (
      <div className={styles.notConnectedContainer}>
        <p className={styles.notConnectedText}>Connect your wallet to start summoning</p>
      </div>
    );
  }

  const buttonClassName = `${styles.button} ${
    canSummon && !isPending && !isConfirming ? styles.buttonEnabled : styles.buttonDisabled
  }`;

  return (
    <div className={styles.container}>
      <button
        onClick={handleSummon}
        disabled={!canSummon || isPending || isConfirming}
        className={buttonClassName}
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
            ? "Summoning..."
            : isSuccess
              ? "Summoned!"
              : canSummon
                ? "Summon Creature"
                : "Summon on Cooldown"}
      </button>

      {timeLeft && (
        <div className={styles.timerContainer}>
          Next summon available in: <span className={styles.timerValue}>{timeLeft}</span>
        </div>
      )}

      {error && <div className={styles.errorMessage}>Error: {error.message}</div>}

      {isSuccess && <div className={styles.successMessage}>Successfully summoned a creature!</div>}
    </div>
  );
}
