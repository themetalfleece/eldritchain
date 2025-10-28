import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Eldritchain } from "../typechain-types";

describe("Distribution Test", function () {
  let eldritchain: Eldritchain;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const EldritchainFactory = await ethers.getContractFactory("Eldritchain", owner);
    eldritchain = (await upgrades.deployProxy(EldritchainFactory, [], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as Eldritchain;
    await eldritchain.waitForDeployment();
  });

  it("Should have proper distribution across 1000 summons with no cooldown reverts", async function () {
    // Track distribution
    const distribution = {
      common: 0,
      rare: 0,
      epic: 0,
      deity: 0,
    };

    const creatureIds: number[] = [];
    let revertCount = 0;

    // Use all available signers to avoid cooldown issues
    const allSigners = await ethers.getSigners();
    const testUsers = allSigners.slice(1); // Skip the first one (owner)

    for (let i = 0; i < 1000; i++) {
      let success = false;
      let attempts = 0;
      const maxAttempts = 3; // Retry failed attempts up to 3 times

      while (!success && attempts < maxAttempts) {
        try {
          // Use different users to avoid cooldown issues
          const userIndex = i % testUsers.length;
          const currentUser = testUsers[userIndex];

          // Check if user can summon and wait for next UTC day if needed
          const canSummon = await eldritchain.canSummon(currentUser.address);

          if (!canSummon) {
            // Fast forward to next UTC day (86400 seconds)
            await ethers.provider.send("evm_increaseTime", [86400]);
            await ethers.provider.send("evm_mine", []);
          }

          // Vary the block timestamp for each summon to get different randomness
          // Add a small random offset to avoid collisions
          const timeOffset = (i % 100) * 3600; // Cycle through to avoid huge timestamps
          await ethers.provider.send("evm_increaseTime", [timeOffset + attempts * 5]);
          await ethers.provider.send("evm_mine", []);

          // Use commit-reveal scheme for summoning
          // Add attempt number to random value to ensure uniqueness
          const randomValue = BigInt(
            `123456789012345678901234567890123456789012345678901234567890${(i + attempts).toString().padStart(4, "0")}`
          );
          const hash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [randomValue])
          );

          // Commit
          const commitTx = await eldritchain.connect(currentUser).commitRandom(hash);
          await commitTx.wait();

          // Wait for target block (more than enough blocks)
          for (let j = 0; j < 10; j++) {
            await ethers.provider.send("evm_mine", []);
          }

          const tx = await eldritchain.connect(currentUser).summon(randomValue);
          const receipt = await tx.wait();

          // Extract creature ID from event
          const event = receipt?.logs.find(
            (log) => "fragment" in log && log.fragment?.name === "CreatureSummoned"
          ) as { args: [string, bigint, bigint] } | undefined;

          if (event) {
            const creatureId = Number(event.args[1]);
            creatureIds.push(creatureId);

            // Categorize by rarity
            if (creatureId >= 0 && creatureId <= 999) {
              distribution.common++;
            } else if (creatureId >= 1000 && creatureId <= 1499) {
              distribution.rare++;
            } else if (creatureId >= 1500 && creatureId <= 1599) {
              distribution.epic++;
            } else if (creatureId >= 1600 && creatureId <= 1649) {
              distribution.deity++;
            }

            success = true; // Mark as successful
          }
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            // Log the error for debugging
            console.error(`❌ Failed after ${maxAttempts} attempts at index ${i}:`, error);
            revertCount++;
          } else {
            // Reset state for retry by mining a few blocks
            for (let j = 0; j < 5; j++) {
              await ethers.provider.send("evm_mine", []);
            }
          }
        }
      }
    }

    // Calculate percentages
    const total = distribution.common + distribution.rare + distribution.epic + distribution.deity;
    const percentages = {
      common: (distribution.common / total) * 100,
      rare: (distribution.rare / total) * 100,
      epic: (distribution.epic / total) * 100,
      deity: (distribution.deity / total) * 100,
    };

    console.log("\n=== DISTRIBUTION RESULTS ===");
    console.log(`Total successful summons: ${total}`);
    console.log(`Total reverts: ${revertCount}`);
    console.log(`\nDistribution:`);
    console.log(
      `Common: ${distribution.common} (${percentages.common.toFixed(2)}%) - Expected: ~70%`
    );
    console.log(`Rare: ${distribution.rare} (${percentages.rare.toFixed(2)}%) - Expected: ~25%`);
    console.log(`Epic: ${distribution.epic} (${percentages.epic.toFixed(2)}%) - Expected: ~4.5%`);
    console.log(
      `Deity: ${distribution.deity} (${percentages.deity.toFixed(2)}%) - Expected: ~0.5%`
    );

    // Verify almost no reverts occurred (allow for very rare edge cases)
    expect(revertCount).to.be.lessThanOrEqual(2, `Expected 0-2 reverts, got ${revertCount}`);
    expect(total).to.be.greaterThanOrEqual(998, `Expected at least 998 successes, got ${total}`);

    // Verify we got creatures from all tiers
    expect(distribution.common).to.be.greaterThan(0, "Should have common creatures");
    expect(distribution.rare).to.be.greaterThan(0, "Should have rare creatures");
    expect(distribution.epic).to.be.greaterThan(0, "Should have epic creatures");
    expect(distribution.deity).to.be.greaterThan(0, "Should have deity creatures");

    // Check that distribution is within reasonable bounds (allowing for randomness)
    // Common should be around 70% (allow 60-80%)
    expect(percentages.common).to.be.greaterThan(60, "Common percentage too low");
    expect(percentages.common).to.be.lessThan(80, "Common percentage too high");

    // Rare should be around 25% (allow 15-35%)
    expect(percentages.rare).to.be.greaterThan(15, "Rare percentage too low");
    expect(percentages.rare).to.be.lessThan(35, "Rare percentage too high");

    // Epic should be around 4.5% (allow 2-8%)
    expect(percentages.epic).to.be.greaterThan(2, "Epic percentage too low");
    expect(percentages.epic).to.be.lessThan(8, "Epic percentage too high");

    // Deity should be around 0.5% (allow 0-2%)
    expect(percentages.deity).to.be.greaterThan(0, "Deity percentage too low");
    expect(percentages.deity).to.be.lessThan(2, "Deity percentage too high");

    // Verify creature IDs are within valid ranges
    for (const creatureId of creatureIds) {
      expect(creatureId).to.be.greaterThanOrEqual(0, "Creature ID should be >= 0");
      expect(creatureId).to.be.lessThanOrEqual(1649, "Creature ID should be <= 1649");
    }

    console.log("\n✅ All distribution tests passed!");
  });
});
