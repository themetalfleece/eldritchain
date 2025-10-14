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

export const config = {
  mongodb: {
    uri: assertEnv(process.env.MONGODB_URI, "MONGODB_URI"),
  },
  contract: {
    address: assertEnvAddress(process.env.CONTRACT_ADDRESS, "CONTRACT_ADDRESS"),
    networkName,
    rpcUrl: network.chain.rpcUrls.default.http[0],
    chainId: network.chain.id,
  },
  api: {
    port: assertEnvInt(process.env.PORT, "PORT"),
  },
  indexer: {
    startBlock: assertEnvBigInt(process.env.START_BLOCK, "START_BLOCK"),
    pollInterval: assertEnvInt(process.env.POLL_INTERVAL, "POLL_INTERVAL"),
  },
};
