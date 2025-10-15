import { networks, type NetworkName } from "@eldritchain/common";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

// Helper to get RPC URL from network config
function getRpcUrl(networkName: NetworkName): string {
  const network = networks[networkName];
  return network.chain.rpcUrls.default.http[0];
}

const networkName = (process.env.NETWORK || "polygonAmoy") as NetworkName;
const privateKey = process.env.PRIVATE_KEY || "";
const accounts = privateKey ? [privateKey] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat", // Tests always use local Hardhat network
  networks: {
    hardhat: {
      // Local development network with EVM testing features
    },
    sepolia: {
      url: getRpcUrl("sepolia"),
      accounts,
    },
    mainnet: {
      url: getRpcUrl("mainnet"),
      accounts,
    },
    polygon: {
      url: getRpcUrl("polygon"),
      accounts,
    },
    polygonAmoy: {
      url: getRpcUrl("polygonAmoy"),
      accounts,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
