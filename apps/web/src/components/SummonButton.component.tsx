"use client";

import { Rarity } from "@/data/creatures.data";
import { getRarityColor } from "@/data/creatures.styles";
import { CommitmentData } from "@/lib/commit-reveal.utils";
import clsx from "clsx";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useSummonActions,
  useSummonAutoActions,
  useSummonButtonText,
  useSummonEvents,
  useSummonPhase,
  useSummonStatusMessage,
} from "./SummonButton.hooks";
import { styles } from "./SummonButton.styles";

export function SummonButton() {
  const { isConnected } = useAccount();
  const [summonedCreature, setSummonedCreature] = useState<{
    id: number;
    name: string;
    rarity: Rarity;
  } | null>(null);

  const [commitmentData, setCommitmentData] = useState<CommitmentData | null>(null);

  const {
    handleCommit,
    handleSummon,
    isCommitPending,
    isCommitConfirming,
    isCommitSuccess,
    commitError,
    isSummonPending,
    isSummonConfirming,
    isSummonSuccess,
    summonError,
  } = useSummonActions({
    commitmentData,
    setCommitmentData,
  });

  const { phase, contractCommitment, currentBlockNumber } = useSummonPhase({
    isCommitPending,
    isCommitConfirming,
    isSummonPending,
    isSummonConfirming,
    summonedCreature,
  });

  useSummonEvents({
    setSummonedCreature,
  });

  const { getButtonText, buttonDisabled } = useSummonButtonText({
    phase,
    isCommitPending,
    isCommitConfirming,
    isCommitSuccess,
    isSummonPending,
    isSummonConfirming,
    isSummonSuccess,
  });

  const { getStatusMessage } = useSummonStatusMessage({
    phase,
    contractCommitment,
    currentBlockNumber: currentBlockNumber ? Number(currentBlockNumber) : undefined,
  });

  // Auto-trigger summon when available (reveal phase)
  useSummonAutoActions({
    phase,
    handleSummon,
    commitmentData,
  });

  const handleButtonClick = () => {
    if (phase === "commit_available") {
      handleCommit();
    } else if (phase === "summon_available") {
      handleSummon();
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.notConnectedContainer}>
        <p className={styles.notConnectedText}>Connect your wallet to start summoning</p>
      </div>
    );
  }

  const buttonClassName = clsx(styles.button, {
    [styles.buttonEnabled]: !buttonDisabled,
    [styles.buttonDisabled]: buttonDisabled,
  });

  return (
    <div className={styles.container}>
      <button onClick={handleButtonClick} disabled={buttonDisabled} className={buttonClassName}>
        {getButtonText()}
      </button>

      <div className={styles.statusContainer}>{getStatusMessage()}</div>

      {(commitError || summonError) && (
        <div className={styles.errorMessage}>Error: {(commitError || summonError)?.message}</div>
      )}

      {isSummonSuccess && summonedCreature && (
        <div className={styles.successMessage}>
          Successfully summoned: <strong>{summonedCreature.name}</strong> (#{summonedCreature.id})
          <div
            className={clsx("mt-2 text-sm font-medium", getRarityColor(summonedCreature.rarity))}
          >
            {summonedCreature.rarity.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
