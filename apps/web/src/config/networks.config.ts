import { Chain } from "viem";
import { mainnet, polygon, polygonAmoy, sepolia } from "viem/chains";

export interface NetworkConfig {
  chain: Chain;
  isTestnet: boolean;
}

export const networks = {
  mainnet: {
    chain: mainnet,
    isTestnet: false,
  } satisfies NetworkConfig,

  sepolia: {
    chain: sepolia,
    isTestnet: true,
  } satisfies NetworkConfig,

  polygon: {
    chain: polygon,
    isTestnet: false,
  } satisfies NetworkConfig,

  polygonAmoy: {
    chain: polygonAmoy,
    isTestnet: true,
  } satisfies NetworkConfig,
} as const;

export type NetworkName = keyof typeof networks;

export function getNetwork(name: NetworkName): NetworkConfig {
  const network = networks[name];
  if (!network) {
    throw new Error(`Unknown network: ${name}. Available: ${Object.keys(networks).join(", ")}`);
  }
  return network;
}
