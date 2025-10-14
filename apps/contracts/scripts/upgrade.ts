import { assertEnv } from "@eldritchain/common";
import * as dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";

dotenv.config();

async function main() {
  // Validate required env vars for upgrade
  assertEnv(process.env.PRIVATE_KEY, "PRIVATE_KEY");
  const proxyAddress = assertEnv(process.env.PROXY_ADDRESS, "PROXY_ADDRESS") as `0x${string}`;

  console.log(`Upgrading Eldritchain at ${proxyAddress}...`);

  const EldritchainV2 = await ethers.getContractFactory("Eldritchain");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, EldritchainV2);

  await upgraded.waitForDeployment();

  console.log("Contract upgraded successfully!");
  console.log(`Proxy address (unchanged): ${proxyAddress}`);
  console.log(`New implementation deployed`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
