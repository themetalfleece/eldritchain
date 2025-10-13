// Direct access to env vars for Next.js static optimization
// Next.js replaces process.env.NEXT_PUBLIC_* at build time, so we access them directly

/**
 * Assert that a required environment variable exists
 * @param value - The env var value (pass process.env.X directly)
 * @param name - The env var name for error messages
 * @returns The value if it exists
 * @throws Error if value is undefined or empty
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

  // Chain configuration
  chainId: parseInt(assertEnv(process.env.NEXT_PUBLIC_CHAIN_ID, "NEXT_PUBLIC_CHAIN_ID")),
  chainName: assertEnv(process.env.NEXT_PUBLIC_CHAIN_NAME, "NEXT_PUBLIC_CHAIN_NAME"),
  rpcUrl: assertEnv(process.env.NEXT_PUBLIC_RPC_URL, "NEXT_PUBLIC_RPC_URL"),
  blockExplorerUrl: assertEnv(
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL,
    "NEXT_PUBLIC_BLOCK_EXPLORER_URL"
  ),
  nativeCurrency: {
    name: assertEnv(
      process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME,
      "NEXT_PUBLIC_NATIVE_CURRENCY_NAME"
    ),
    symbol: assertEnv(
      process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL,
      "NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL"
    ),
    decimals: parseInt(
      assertEnv(
        process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS,
        "NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS"
      )
    ),
  },
};
