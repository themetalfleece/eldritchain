import { ethers, upgrades } from "hardhat";
import { env } from "../env.config";

async function main() {
  console.log(`Deploying Eldrichain to ${env.defaultNetwork}...`);

  const Eldrichain = await ethers.getContractFactory("Eldrichain");
  const eldrichain = await upgrades.deployProxy(Eldrichain, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await eldrichain.waitForDeployment();

  const address = await eldrichain.getAddress();
  console.log(`Eldrichain deployed to: ${address}`);

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
