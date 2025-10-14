import { type NetworkName } from "@/config/networks.config";

/**
 * Assert that a required environment variable exists
 */
function assertEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Please check your .env.local file and restart the dev server.`
    );
  }
  return value;
}

export const env = {
  contractAddress: assertEnv(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    "NEXT_PUBLIC_CONTRACT_ADDRESS"
  ) as `0x${string}`,

  walletConnectProjectId: assertEnv(
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
  ),

  network: assertEnv(process.env.NEXT_PUBLIC_NETWORK, "NEXT_PUBLIC_NETWORK") as NetworkName,
};
