import { ethers, upgrades } from "hardhat";
import { env } from "../env.config";

async function main() {
  console.log(`Deploying Eldritchain to ${env.defaultNetwork}...`);

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
  console.log(`yarn upgrade`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
