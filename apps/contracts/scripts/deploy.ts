import { assertEnv, type NetworkName } from "@eldritchain/common";
import * as dotenv from "dotenv";
import hre, { ethers, upgrades } from "hardhat";

dotenv.config();

async function main() {
  // Validate required env vars for deployment
  assertEnv(process.env.PRIVATE_KEY, "PRIVATE_KEY");

  const network = (hre.network.name || "polygonAmoy") as NetworkName;
  console.log(`Deploying Eldritchain to ${network}...`);

  const Eldritchain = await ethers.getContractFactory("Eldritchain");
  const eldritchain = await upgrades.deployProxy(Eldritchain, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await eldritchain.waitForDeployment();

  const address = await eldritchain.getAddress();
  console.log(`Eldritchain deployed to: ${address}`);

  console.log("\nSave this address to your .env files:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`PROXY_ADDRESS=${address}`);

  console.log("\nTo upgrade the contract later, run:");
  console.log(`yarn upgrade ${network}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
