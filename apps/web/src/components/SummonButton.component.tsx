"use client";

import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { getCreature } from "@/data/creatures.data";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { styles } from "./SummonButton.styles";

interface SummonButtonProps {
  onSummonComplete?: (creatureId: bigint) => void;
}

export function SummonButton({ onSummonComplete }: SummonButtonProps) {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [summonedCreature, setSummonedCreature] = useState<{ id: number; name: string } | null>(
    null
  );

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

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
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

      // Format as local time respecting user's locale
      const date = new Date(nextTime * 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      const dateString = date.toLocaleDateString();
      const timeString = date.toLocaleTimeString();
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s (${dateString} ${timeString})`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextSummonTime, canSummon]);

  useEffect(() => {
    if (isSuccess && receipt) {
      // Parse the CreatureSummoned event from the receipt
      // Event signature: CreatureSummoned(address indexed user, uint256 indexed creatureId, uint256 level)
      const logs = receipt.logs.filter(
        (log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
      );

      if (logs.length > 0 && logs[0].topics.length >= 3) {
        // The creatureId is in topics[2] (second indexed parameter)
        const creatureIdHex = logs[0].topics[2];
        if (!creatureIdHex) {
          return;
        }

        const creatureId = parseInt(creatureIdHex, 16);
        const creature = getCreature(creatureId);

        if (creature) {
          setSummonedCreature({ id: creatureId, name: creature.name });
        }

        if (onSummonComplete) {
          setTimeout(() => {
            onSummonComplete(BigInt(creatureId));
          }, 1000);
        }
      }
    }
  }, [isSuccess, receipt, onSummonComplete]);

  const handleSummon = () => {
    setSummonedCreature(null); // Reset previous summon
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

      {isSuccess && summonedCreature && (
        <div className={styles.successMessage}>
          Successfully summoned: <strong>{summonedCreature.name}</strong> (#{summonedCreature.id})
        </div>
      )}
    </div>
  );
}
