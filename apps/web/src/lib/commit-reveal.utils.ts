import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { encodePacked, keccak256 } from "viem";

dayjs.extend(duration);

export interface CommitmentData {
  randomValue: bigint;
  hash: string;
  commitTimestamp: number;
  targetBlockNumber: number;
}

export interface CommitmentStatus {
  hasCommitment: boolean;
  canReveal: boolean;
  isRevealed: boolean;
  targetBlockNumber: number;
  currentBlockNumber: number;
  blocksRemaining: number;
}

// Contract commitment structure (matches the Solidity struct)
export interface ContractCommitment {
  hash: string;
  commitTimestamp: bigint;
  targetBlockNumber: bigint;
  isRevealed: boolean;
}

/**
 * Generate a random value and its hash for commit-reveal scheme
 */
export function generateCommitmentData(): CommitmentData {
  // Generate a random 256-bit value
  const randomValue =
    BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) *
    BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

  // Create hash of the random value using abi.encodePacked (same as contract)
  const hash = keccak256(encodePacked(["uint256"], [randomValue]));

  return {
    randomValue,
    hash,
    commitTimestamp: dayjs().unix(),
    targetBlockNumber: 0, // Will be set by contract
  };
}

/**
 * Store commitment data in localStorage for persistence
 */
export function storeCommitmentData(address: string, data: CommitmentData): void {
  const key = `commitment_${address.toLowerCase()}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      ...data,
      randomValue: data.randomValue.toString(),
    })
  );
}

/**
 * Retrieve commitment data from localStorage
 */
export function getCommitmentData(address: string): CommitmentData | null {
  const key = `commitment_${address.toLowerCase()}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      randomValue: BigInt(parsed.randomValue),
    };
  } catch {
    return null;
  }
}

/**
 * Clear commitment data from localStorage
 */
export function clearCommitmentData(address: string): void {
  const key = `commitment_${address.toLowerCase()}`;
  localStorage.removeItem(key);
}

/**
 * Check if commitment is from the same UTC day
 */
export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  return dayjs.unix(timestamp1).isSame(dayjs.unix(timestamp2), "day");
}

/**
 * Format time remaining until target block
 */
export function formatBlocksRemaining(blocksRemaining: number): string {
  if (blocksRemaining <= 0) {
    return "Ready to summon!";
  }

  // Convert blocks to seconds (assuming 2 seconds per block for Polygon)
  const seconds = blocksRemaining * 2;

  if (seconds < 60) {
    return `${seconds}s (${blocksRemaining} blocks)`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s (${blocksRemaining} blocks)`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s (${blocksRemaining} blocks)`;
}
