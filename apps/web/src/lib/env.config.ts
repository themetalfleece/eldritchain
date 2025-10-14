import { type NetworkName } from "@/config/networks.config";
import { assertEnv, assertEnvAddress } from "@eldritchain/common";

export const env = {
  contractAddress: assertEnvAddress(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    "NEXT_PUBLIC_CONTRACT_ADDRESS"
  ),

  walletConnectProjectId: assertEnv(
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
  ),

  network: assertEnv(process.env.NEXT_PUBLIC_NETWORK, "NEXT_PUBLIC_NETWORK") as NetworkName,

  indexerApiUrl: process.env.NEXT_PUBLIC_INDEXER_API_URL?.trim() || null,
};
