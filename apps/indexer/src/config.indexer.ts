import {
  assertEnv,
  assertEnvAddress,
  assertEnvBigInt,
  assertEnvInt,
  getNetwork,
  type NetworkName,
} from "@eldritchain/common";
import dotenv from "dotenv";

dotenv.config();

const networkName = assertEnv(process.env.NETWORK, "NETWORK") as NetworkName;
const network = getNetwork(networkName);

// Indexer-specific configuration
export const indexerConfig = {
  contract: {
    address: assertEnvAddress(process.env.CONTRACT_ADDRESS, "CONTRACT_ADDRESS"),
    networkName,
    rpcUrl: network.chain.rpcUrls.default.http[0],
    chainId: network.chain.id,
  },
  startBlock: assertEnvBigInt(process.env.START_BLOCK, "START_BLOCK"),
  pollInterval: assertEnvInt(process.env.POLL_INTERVAL, "POLL_INTERVAL"),
  maxBlocksPerPoll: assertEnvInt(process.env.MAX_BLOCKS_PER_POLL, "MAX_BLOCKS_PER_POLL"),
  safeBlockRange: process.env.SAFE_BLOCK_RANGE
    ? assertEnvBigInt(process.env.SAFE_BLOCK_RANGE, "SAFE_BLOCK_RANGE")
    : 100n, // Default: 100 blocks behind finalized
};
