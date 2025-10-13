import { ethers, upgrades } from "hardhat";
import { env } from "../env.config";

async function main() {
  if (!env.proxyAddress) {
    throw new Error("Please set PROXY_ADDRESS in .env");
  }

  console.log(`Upgrading Eldrichain at ${env.proxyAddress}...`);

  const EldrichainV2 = await ethers.getContractFactory("Eldrichain");
  const upgraded = await upgrades.upgradeProxy(env.proxyAddress, EldrichainV2);

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
