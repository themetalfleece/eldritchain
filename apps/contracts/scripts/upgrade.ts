import { ethers, upgrades } from "hardhat";
import { env } from "../env.config";

async function main() {
  if (!env.proxyAddress) {
    throw new Error("Please set PROXY_ADDRESS in .env");
  }

  console.log(`Upgrading Eldritchain at ${env.proxyAddress}...`);

  const EldritchainV2 = await ethers.getContractFactory("Eldritchain");
  const upgraded = await upgrades.upgradeProxy(env.proxyAddress, EldritchainV2);

  await upgraded.waitForDeployment();

  console.log("Contract upgraded successfully!");
  console.log(`Proxy address (unchanged): ${env.proxyAddress}`);
  console.log(`New implementation deployed`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
