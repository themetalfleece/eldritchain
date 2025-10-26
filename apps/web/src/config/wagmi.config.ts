import { getNetwork } from "@/config/networks.config";
import { env } from "@/lib/env.config";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

const networkConfig = getNetwork(env.network);

// Create a custom chain with the preferred RPC URL
const customChain = defineChain({
  ...networkConfig.chain,
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || networkConfig.chain.rpcUrls.default.http[0]],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || networkConfig.chain.rpcUrls.default.http[0]],
    },
  },
});

export const config = getDefaultConfig({
  appName: "Eldritchain",
  projectId: env.walletConnectProjectId,
  chains: [customChain],
  ssr: true,
});

export { networkConfig };
