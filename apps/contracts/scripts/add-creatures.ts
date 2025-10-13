import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";
import { env } from "../env.config";

async function main() {
  if (!env.proxyAddress) {
    throw new Error("Please set PROXY_ADDRESS in .env");
  }

  console.log(`Syncing creatures from data file to contract at ${env.proxyAddress}...`);

  const Eldrichain = await ethers.getContractAt("Eldrichain", env.proxyAddress);

  // Read creatures from JSON file
  const creaturesPath = path.join(__dirname, "../../web/src/data/creatures.json");

  if (!fs.existsSync(creaturesPath)) {
    throw new Error(`Creatures data file not found at: ${creaturesPath}`);
  }

  const creaturesContent = fs.readFileSync(creaturesPath, "utf-8");
  const creaturesData = JSON.parse(creaturesContent) as Array<{
    id: number;
    name: string;
    rarity: string;
    description: string;
  }>;

  // Parse creature IDs by rarity from the file
  const commonIds: number[] = [];
  const rareIds: number[] = [];
  const epicIds: number[] = [];
  const deityIds: number[] = [];

  // Group creatures by rarity
  for (const creature of creaturesData) {
    const { id, rarity } = creature;

    if (rarity === "common") {
      commonIds.push(id);
    } else if (rarity === "rare") {
      rareIds.push(id);
    } else if (rarity === "epic") {
      epicIds.push(id);
    } else if (rarity === "deity") {
      deityIds.push(id);
    }
  }

  if (
    commonIds.length === 0 &&
    rareIds.length === 0 &&
    epicIds.length === 0 &&
    deityIds.length === 0
  ) {
    throw new Error("No creatures found in data file. Check the file format.");
  }

  // Get current state from contract
  console.log("\nCurrent contract state:");
  const currentCommonLast = Number(await Eldrichain.commonLast());
  const currentRareLast = Number(await Eldrichain.rareLast());
  const currentEpicLast = Number(await Eldrichain.epicLast());
  const currentDeityLast = Number(await Eldrichain.deityLast());

  console.log(`  Common: ${await Eldrichain.commonCount()} creatures (0-${currentCommonLast})`);
  console.log(`  Rare: ${await Eldrichain.rareCount()} creatures (1000-${currentRareLast})`);
  console.log(`  Epic: ${await Eldrichain.epicCount()} creatures (1500-${currentEpicLast})`);
  console.log(`  Deity: ${await Eldrichain.deityCount()} creatures (1600-${currentDeityLast})`);

  // Calculate new last IDs from data file
  const newCommonLast = commonIds.length > 0 ? Math.max(...commonIds) : currentCommonLast;
  const newRareLast = rareIds.length > 0 ? Math.max(...rareIds) : currentRareLast;
  const newEpicLast = epicIds.length > 0 ? Math.max(...epicIds) : currentEpicLast;
  const newDeityLast = deityIds.length > 0 ? Math.max(...deityIds) : currentDeityLast;

  console.log("\nCreatures found in data file:");
  console.log(`  Common: ${commonIds.length} creatures (highest ID: ${newCommonLast})`);
  console.log(`  Rare: ${rareIds.length} creatures (highest ID: ${newRareLast})`);
  console.log(`  Epic: ${epicIds.length} creatures (highest ID: ${newEpicLast})`);
  console.log(`  Deity: ${deityIds.length} creatures (highest ID: ${newDeityLast})`);

  // Check if update is needed
  if (
    newCommonLast === currentCommonLast &&
    newRareLast === currentRareLast &&
    newEpicLast === currentEpicLast &&
    newDeityLast === currentDeityLast
  ) {
    console.log("\n✅ Contract is already up to date! No changes needed.");
    return;
  }

  console.log("\nUpdating contract to match data file...");

  const tx = await Eldrichain.addCreatures(newCommonLast, newRareLast, newEpicLast, newDeityLast);

  await tx.wait();

  console.log("\n✅ Contract updated successfully!");
  console.log("New contract state:");
  console.log(`  Common: ${newCommonLast - 0 + 1} creatures (0-${newCommonLast})`);
  console.log(`  Rare: ${newRareLast - 1000 + 1} creatures (1000-${newRareLast})`);
  console.log(`  Epic: ${newEpicLast - 1500 + 1} creatures (1500-${newEpicLast})`);
  console.log(`  Deity: ${newDeityLast - 1600 + 1} creatures (1600-${newDeityLast})`);

  // Show what was added
  const addedCommons = newCommonLast - currentCommonLast;
  const addedRares = newRareLast - currentRareLast;
  const addedEpics = newEpicLast - currentEpicLast;
  const addedDeities = newDeityLast - currentDeityLast;

  if (addedCommons > 0 || addedRares > 0 || addedEpics > 0 || addedDeities > 0) {
    console.log("\nCreatures added:");
    if (addedCommons > 0) {
      console.log(`  +${addedCommons} commons (${currentCommonLast + 1}-${newCommonLast})`);
    }
    if (addedRares > 0) {
      console.log(`  +${addedRares} rares (${currentRareLast + 1}-${newRareLast})`);
    }
    if (addedEpics > 0) {
      console.log(`  +${addedEpics} epics (${currentEpicLast + 1}-${newEpicLast})`);
    }
    if (addedDeities > 0) {
      console.log(`  +${addedDeities} deities (${currentDeityLast + 1}-${newDeityLast})`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
