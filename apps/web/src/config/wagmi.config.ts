import { env } from "@/lib/env.config";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

// Define chain dynamically from environment variables
const targetChain = defineChain({
  id: env.chainId,
  name: env.chainName,
  nativeCurrency: env.nativeCurrency,
  rpcUrls: {
    default: { http: [env.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: env.blockExplorerUrl,
    },
  },
});

export const config = getDefaultConfig({
  appName: "Eldritchain",
  projectId: env.walletConnectProjectId,
  chains: [targetChain],
  ssr: true,
});
