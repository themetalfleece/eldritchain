export const BLOCK_CONFIG = {
  // Average seconds per block for different networks
  averageSecondsPerBlock: {
    137: 2, // Polygon
    80002: 2, // Polygon Amoy
    1: 12, // Ethereum
    11155111: 12, // Sepolia
  },
} as const;

const DEFAULT_AVERAGE_SECONDS_PER_BLOCK = BLOCK_CONFIG.averageSecondsPerBlock[137];

export function getAverageSecondsPerBlock(chainId?: number): number {
  if (!chainId) {
    return DEFAULT_AVERAGE_SECONDS_PER_BLOCK;
  }

  return (
    BLOCK_CONFIG.averageSecondsPerBlock[
      chainId as keyof typeof BLOCK_CONFIG.averageSecondsPerBlock
    ] || DEFAULT_AVERAGE_SECONDS_PER_BLOCK
  );
}
