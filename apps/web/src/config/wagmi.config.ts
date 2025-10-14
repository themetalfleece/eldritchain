import { getNetwork } from "@/config/networks.config";
import { env } from "@/lib/env.config";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const networkConfig = getNetwork(env.network);

export const config = getDefaultConfig({
  appName: "Eldritchain",
  projectId: env.walletConnectProjectId,
  chains: [networkConfig.chain],
  ssr: true,
});

export { networkConfig };
