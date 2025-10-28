import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract.config";
import { networkConfig } from "@/config/wagmi.config";
import { Rarity } from "@/data/creatures.data";
import {
  clearCommitmentData,
  formatBlocksRemaining,
  generateCommitmentData,
  getCommitmentData,
  storeCommitmentData,
  type CommitmentData,
  type ContractCommitment,
} from "@/lib/commit-reveal.utils";
import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useBlockNumber,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export type SummonPhase =
  | "commit_available"
  | "committing"
  | "waiting_for_reveal_available"
  | "summon_available"
  | "summoning"
  | "creature_summoned"
  | "cooldown_active";

// Hook for determining the current summon phase
export function useSummonPhase({
  isCommitPending,
  isCommitConfirming,
  isSummonPending,
  isSummonConfirming,
  summonedCreature,
}: {
  isCommitPending?: boolean;
  isCommitConfirming?: boolean;
  isSummonPending?: boolean;
  isSummonConfirming?: boolean;
  summonedCreature?: { id: number; name: string; rarity: Rarity } | null;
} = {}) {
  const { address, isConnected } = useAccount();
  const { data: currentBlockNumber } = useBlockNumber({ watch: true });
  const [commitmentData, setCommitmentData] = useState<CommitmentData | null>(null);
  const [phase, setPhase] = useState<SummonPhase>("cooldown_active");

  const canCommitEnabled = !!address && phase !== "creature_summoned";
  const { data: canCommit } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "canCommit",
    args: address ? [address] : undefined,
    query: {
      enabled: canCommitEnabled,
      refetchInterval: 1700,
    },
  });

  const canSummonEnabled =
    !!address && phase !== "creature_summoned" && phase !== "cooldown_active";
  const { data: canSummon } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "canSummon",
    args: address ? [address] : undefined,
    query: {
      enabled: canSummonEnabled,
      refetchInterval: 1700,
    },
  });

  const getCommitmentEnabled = !!address && phase !== "creature_summoned";
  const { data: contractCommitment } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCommitment",
    args: address ? [address] : undefined,
    query: {
      enabled: getCommitmentEnabled,
      refetchInterval: 1700,
    },
  });

  const hasCommitment =
    contractCommitment &&
    contractCommitment.hash !==
      "0x0000000000000000000000000000000000000000000000000000000000000000";

  const isCommitmentValidEnabled = !!address && hasCommitment && phase === "committing";
  const { data: isCommitmentValid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isCommitmentValidForDay",
    args: address ? [address] : undefined,
    query: {
      enabled: isCommitmentValidEnabled,
      refetchInterval: 1700,
    },
  });

  // Load persisted commitment data on mount
  useEffect(() => {
    if (address && !commitmentData) {
      const stored = getCommitmentData(address);
      if (stored) {
        setCommitmentData(stored);
      }
    }
  }, [address, commitmentData]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setCommitmentData(null);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!address || !contractCommitment || !currentBlockNumber || canCommit === undefined) {
      return;
    }

    // Check if creature was just summoned - highest priority
    if (summonedCreature) {
      setPhase("creature_summoned");
      return;
    }

    // Can summon (has valid commitment and target block is ready)
    if (canSummon) {
      setPhase("summon_available");
      return;
    }

    if (isCommitPending || isCommitConfirming) {
      setPhase("committing");
      return;
    }

    if (isSummonPending || isSummonConfirming) {
      setPhase("summoning");
      return;
    }

    // Has commitment but can't summon yet - check if commitment is still valid
    if (hasCommitment && !contractCommitment.isRevealed && isCommitmentValid) {
      // Valid commitment, waiting for target block
      setPhase("waiting_for_reveal_available");
      return;
    }

    if (hasCommitment && !contractCommitment.isRevealed && !isCommitmentValid) {
      // Expired commitment (255+ blocks old or different day)
      setPhase("cooldown_active");
      return;
    }

    // Can commit (no commitment or new day)
    if (canCommit) {
      setPhase("commit_available");
      return;
    }

    // Cooldown (both canCommit and canSummon are false)
    setPhase("cooldown_active");
  }, [
    address,
    canSummon,
    canCommit,
    isCommitmentValid,
    contractCommitment,
    hasCommitment,
    currentBlockNumber,
    commitmentData,
    isCommitPending,
    isCommitConfirming,
    isSummonPending,
    isSummonConfirming,
    summonedCreature,
  ]);

  // Calculate blocks remaining
  const blocksRemaining =
    contractCommitment && currentBlockNumber
      ? Math.max(0, Number(contractCommitment.targetBlockNumber) - Number(currentBlockNumber))
      : undefined;

  return {
    phase,
    commitmentData,
    setCommitmentData,
    canSummon,
    canCommit,
    contractCommitment,
    currentBlockNumber,
    blocksRemaining,
  };
}

// Hook for handling commit and summon transactions
export function useSummonActions({
  commitmentData,
  setCommitmentData,
}: {
  commitmentData: CommitmentData | null;
  setCommitmentData: (data: CommitmentData | null) => void;
}) {
  const { address } = useAccount();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  // Get the chain ID from the network config
  const chainId = networkConfig.chain.id;

  // Commit transaction state
  const {
    writeContract: writeCommitContract,
    data: commitHash,
    isPending: isCommitPending,
    error: commitError,
    reset: resetCommitState,
  } = useWriteContract();

  const {
    isLoading: isCommitConfirming,
    isSuccess: isCommitSuccess,
    data: commitReceipt,
  } = useWaitForTransactionReceipt({
    hash: commitHash,
  });

  // Summon transaction state
  const {
    writeContract: writeSummonContract,
    data: summonHash,
    isPending: isSummonPending,
    error: summonError,
    reset: resetSummonState,
  } = useWriteContract();

  const {
    isLoading: isSummonConfirming,
    isSuccess: isSummonSuccess,
    data: summonReceipt,
  } = useWaitForTransactionReceipt({
    hash: summonHash,
  });

  // Reset transaction state when wallet changes
  useResetOnWalletChange(resetCommitState);
  useResetOnWalletChange(resetSummonState);

  // Execute commit action
  const executeCommit = () => {
    if (!address) {
      return;
    }

    // Generate commitment data
    const data = generateCommitmentData();
    setCommitmentData(data);
    storeCommitmentData(address, data);

    writeCommitContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "commitRandom",
      args: [data.hash as `0x${string}`],
    });
  };

  // Execute summon action
  const executeSummon = () => {
    if (!commitmentData) {
      return;
    }

    writeSummonContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "summon",
      args: [commitmentData.randomValue],
    });
  };

  const handleCommit = async () => {
    if (!address) {
      return;
    }

    try {
      await switchChain({ chainId });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }

    executeCommit();
  };

  const handleSummon = async () => {
    if (!commitmentData) {
      return;
    }

    try {
      await switchChain({ chainId });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }

    executeSummon();
  };

  return {
    handleCommit,
    handleSummon,
    isCommitPending,
    isCommitConfirming,
    isCommitSuccess,
    commitError,
    commitReceipt,
    isSummonPending,
    isSummonConfirming,
    isSummonSuccess,
    summonError,
    summonReceipt,
    summonHash,
    isSwitchingChain,
  };
}

// Hook for handling successful transactions and event processing
export function useSummonEvents({
  setSummonedCreature,
  summonHash,
  isSummonSuccess,
}: {
  setSummonedCreature: (creature: { id: number; name: string; rarity: Rarity } | null) => void;
  summonHash?: `0x${string}`;
  isSummonSuccess?: boolean;
}) {
  const { address } = useAccount();
  const { data: summonReceipt } = useWaitForTransactionReceipt({
    hash: summonHash,
    query: {
      enabled: !!summonHash,
    },
  });

  useEffect(() => {
    if (!isSummonSuccess || !summonReceipt) {
      return;
    }

    const logs = summonReceipt.logs.filter(
      (log) => log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
    );

    // Handle CreatureSummoned event
    // Event signature: CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp)
    // Event signature hash: 0x3afcdbce1e3b42d6685e2020ee7c099a88f43cdb3a5b7de414ebe16c959df338
    const eventSignature = "0x3afcdbce1e3b42d6685e2020ee7c099a88f43cdb3a5b7de414ebe16c959df338";
    const summonLog = logs.find((log) => log.topics[0] === eventSignature);

    if (summonLog && summonLog.topics.length >= 3) {
      const creatureIdHex = summonLog.topics[2];

      if (creatureIdHex) {
        const creatureId = parseInt(creatureIdHex, 16);

        import("@/data/creatures.data")
          .then(({ getCreature }) => {
            const creature = getCreature(creatureId);

            if (creature) {
              setSummonedCreature({
                id: creatureId,
                name: creature.name,
                rarity: creature.rarity,
              });
            }
          })
          .catch((error) => {
            console.error("Error loading creature data:", error);
          });

        // Clear commitment data after successful summon
        if (address) {
          clearCommitmentData(address);
        }
      }
    }
  }, [isSummonSuccess, summonReceipt, address, setSummonedCreature]);
}

// Hook for managing summon status and timing
export function useSummonStatus({ enabled }: { enabled: boolean }) {
  const { address } = useAccount();
  const { data: nextSummonTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getNextSummonTime",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address,
    },
  });

  return {
    nextSummonTime,
  };
}

// Hook for getting button text based on current state
export function useSummonButtonText({
  phase,
  isCommitPending,
  isCommitConfirming,
  isCommitSuccess,
  isSummonPending,
  isSummonConfirming,
  isSummonSuccess,
  isSwitchingChain,
}: {
  phase: SummonPhase;
  isCommitPending: boolean;
  isCommitConfirming: boolean;
  isCommitSuccess: boolean;
  isSummonPending: boolean;
  isSummonConfirming: boolean;
  isSummonSuccess: boolean;
  isSwitchingChain?: boolean;
}) {
  const getButtonText = () => {
    if (isSwitchingChain) {
      return "Switching Network...";
    }
    if (isCommitPending || isSummonPending) {
      return "Confirm in Wallet...";
    }
    if (isCommitConfirming) {
      return "Committing...";
    }
    if (isSummonConfirming) {
      return "Summoning...";
    }
    if (isCommitSuccess) {
      return "Committed!";
    }
    if (isSummonSuccess) {
      return "Summoned!";
    }

    if (phase === "commit_available") {
      return "Commit Random Value";
    }

    if (phase === "committing") {
      return "Committing...";
    }

    if (phase === "waiting_for_reveal_available") {
      return "Waiting for Blocks...";
    }

    if (phase === "summon_available") {
      return "Summon Creature";
    }

    if (phase === "summoning") {
      return "Summoning...";
    }

    if (phase === "creature_summoned") {
      return "Creature Summoned!";
    }

    if (phase === "cooldown_active") {
      return "Summon on Cooldown";
    }

    return "Summon Creature";
  };

  const getButtonDisabled = () => {
    return (
      isSwitchingChain ||
      isCommitPending ||
      isCommitConfirming ||
      isSummonPending ||
      isSummonConfirming ||
      phase === "creature_summoned"
    );
  };

  return {
    getButtonText,
    buttonText: getButtonText(),
    buttonDisabled: getButtonDisabled(),
  };
}

// Hook for getting status messages
export function useSummonStatusMessage({
  phase,
  contractCommitment,
  currentBlockNumber,
}: {
  phase: SummonPhase;
  contractCommitment: ContractCommitment | undefined;
  currentBlockNumber: number | undefined;
}) {
  const { nextSummonTime } = useSummonStatus({ enabled: phase === "cooldown_active" });
  const [countdown, setCountdown] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    dateString: string;
    timeString: string;
  } | null>(null);

  // Update every second during cooldown to show live countdown
  useEffect(() => {
    if (phase !== "cooldown_active" || !nextSummonTime) {
      return;
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const nextTime = Number(nextSummonTime);
      const diff = nextTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        const date = new Date(nextTime * 1000);
        const dateString = date.toLocaleDateString();
        const timeString = date.toLocaleTimeString();

        setCountdown({ hours, minutes, seconds, dateString, timeString });
      } else {
        setCountdown(null);
      }
    };

    // Initial calculation
    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [phase, nextSummonTime]);

  const getStatusMessage = () => {
    if (phase === "commit_available") {
      return "First, you need to commit a random value to the blockchain. This prevents manipulation of the summon result. [Transaction 1/2]";
    }

    if (phase === "committing") {
      return "You are committing your random value to the blockchain...";
    }

    if (phase === "waiting_for_reveal_available") {
      if (contractCommitment && currentBlockNumber) {
        const blocksRemaining = Math.max(
          0,
          Number(contractCommitment.targetBlockNumber) - Number(currentBlockNumber)
        );

        if (blocksRemaining === 0) {
          return "The target block has been mined. Please wait a moment...";
        }

        return `Waiting for ${blocksRemaining} more blocks... ${formatBlocksRemaining(blocksRemaining)}`;
      }
      return "Waiting for target block to be mined...";
    }

    if (phase === "summon_available") {
      return "Ready to summon! [Transaction 2/2]";
    }

    if (phase === "summoning") {
      return "You are summoning your creature... Best of luck!";
    }

    if (phase === "creature_summoned") {
      return "Congratulations! Your creature has been summoned successfully.";
    }

    if (phase === "cooldown_active") {
      if (countdown) {
        return `Next summon available in: ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s (${countdown.dateString} ${countdown.timeString})`;
      }
      return "Please wait for the cooldown period to end.";
    }

    return "";
  };

  return { getStatusMessage };
}

// Hook for automatic summon actions (reveal)
export function useSummonAutoActions({
  phase,
  handleSummon,
  commitmentData,
}: {
  phase: SummonPhase;
  handleSummon: () => void;
  commitmentData: CommitmentData | null;
}) {
  const [hasAutoSummoned, setHasAutoSummoned] = useState(false);

  useEffect(() => {
    // Reset auto-summon flag when commitment data changes
    if (commitmentData) {
      setHasAutoSummoned(false);
    }
  }, [commitmentData]); // Track by hash to detect new commitments

  useEffect(() => {
    // Auto-summon when phase becomes summon_available (reveal phase) but only once per commitment
    if (phase === "summon_available" && !hasAutoSummoned && commitmentData) {
      handleSummon();
      setHasAutoSummoned(true);
    }
  }, [phase, handleSummon, hasAutoSummoned, commitmentData]);
}

// Reusable hook for resetting state when wallet changes
export function useResetOnWalletChange(resetCallback: () => void) {
  const { address } = useAccount();
  const previousAddress = useRef<string | undefined>(address);

  useEffect(() => {
    // Check if address has changed (not just initialized)
    if (previousAddress.current !== undefined && previousAddress.current !== address) {
      // Wallet has changed - run the reset callback
      resetCallback();
    }

    // Update the previous address reference
    previousAddress.current = address;
  }, [address, resetCallback]);
}
