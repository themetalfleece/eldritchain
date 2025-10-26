import { assertEnv, type NetworkName } from "@eldritchain/common";
import * as dotenv from "dotenv";
import hre, { ethers, upgrades } from "hardhat";

dotenv.config();

async function main() {
  // Validate required env vars for upgrade
  assertEnv(process.env.PRIVATE_KEY, "PRIVATE_KEY");
  const proxyAddress = assertEnv(process.env.PROXY_ADDRESS, "PROXY_ADDRESS") as `0x${string}`;

  const network = (hre.network.name || "polygonAmoy") as NetworkName;
  console.log(`Upgrading Eldritchain at ${proxyAddress} on ${network}...`);

  const EldritchainV2 = await ethers.getContractFactory("Eldritchain");

  // Check if we're the owner before attempting upgrade
  const currentContract = EldritchainV2.attach(proxyAddress);
  try {
    const owner = await currentContract.owner();
    const [signer] = await ethers.getSigners();
    const signerAddress = await signer.getAddress();
    console.log(`Contract owner: ${owner}`);
    console.log(`Upgrade signer: ${signerAddress}`);

    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.log("❌ ERROR: You are not the owner of this contract!");
      console.log("Only the contract owner can upgrade the contract.");
      return;
    }
    console.log("✅ You are the contract owner, proceeding with upgrade...");
  } catch (error) {
    console.log("❌ Error checking ownership:", error);
    return;
  }

  console.log("Deploying new implementation...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, EldritchainV2);

  await upgraded.waitForDeployment();

  console.log("Contract upgraded successfully!");
  console.log(`Proxy address (unchanged): ${proxyAddress}`);
  console.log(`New implementation deployed on ${network}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
