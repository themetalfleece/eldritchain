import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Eldritchain } from "../typechain-types";

describe("Distribution Test", function () {
  let eldritchain: Eldritchain;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let users: SignerWithAddress[];

  beforeEach(async function () {
    [owner, user1, ...users] = await ethers.getSigners();
    const EldritchainFactory = await ethers.getContractFactory("Eldritchain", owner);
    eldritchain = (await upgrades.deployProxy(EldritchainFactory, [], {
      initializer: "initialize",
      kind: "uups",
    })) as any;
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
      try {
        // Use different users to avoid cooldown issues
        const userIndex = i % testUsers.length;
        const currentUser = testUsers[userIndex];

        // Check if user can summon (if not, fast forward time)
        const canSummon = await eldritchain.canSummon(currentUser.address);

        if (!canSummon) {
          // If user can't summon, fast forward time for this user
          await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
          await ethers.provider.send("evm_mine", []);
        }

        // Vary the block timestamp for each summon to get different randomness
        // Use evm_increaseTime to avoid timestamp conflicts
        const timeOffset = i * 3600; // 1 hour increments
        await ethers.provider.send("evm_increaseTime", [timeOffset]);
        await ethers.provider.send("evm_mine", []);

        const tx = await eldritchain.connect(currentUser).summon();
        const receipt = await tx.wait();

        // Extract creature ID from event
        const event = receipt?.logs.find(
          (log: any) => log.fragment?.name === "CreatureSummoned"
        ) as any;

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
        }
      } catch (error) {
        revertCount++;
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

    // Verify no reverts occurred (we should have 1000 successful summons)
    expect(revertCount).to.equal(0, "No summons should revert");
    expect(total).to.equal(1000, "Should have exactly 1000 successful summons");

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
