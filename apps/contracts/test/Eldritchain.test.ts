import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Eldritchain } from "../typechain-types";

describe("Eldritchain", function () {
  let eldritchain: Eldritchain;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    const EldritchainFactory = await ethers.getContractFactory("Eldritchain", owner);
    eldritchain = (await upgrades.deployProxy(EldritchainFactory, [], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as Eldritchain;
    await eldritchain.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial counts and bases", async function () {
      // Check namespace bases are fixed
      expect(await eldritchain.COMMON_BASE()).to.equal(0);
      expect(await eldritchain.RARE_BASE()).to.equal(1000);
      expect(await eldritchain.EPIC_BASE()).to.equal(1500);
      expect(await eldritchain.DEITY_BASE()).to.equal(1600);

      // Check initial last IDs
      expect(await eldritchain.commonLast()).to.equal(59);
      expect(await eldritchain.rareLast()).to.equal(1019);
      expect(await eldritchain.epicLast()).to.equal(1511);
      expect(await eldritchain.deityLast()).to.equal(1604);

      // Check calculated counts
      expect(await eldritchain.commonCount()).to.equal(60);
      expect(await eldritchain.rareCount()).to.equal(20);
      expect(await eldritchain.epicCount()).to.equal(12);
      expect(await eldritchain.deityCount()).to.equal(5);
    });
  });

  describe("Summoning (Legacy - Now Requires Commit-Reveal)", function () {
    it("Should require commit-reveal scheme", async function () {
      // The old summon() function now requires a randomValue parameter
      // This test demonstrates that the old API is no longer available
      expect(await eldritchain.canSummon(owner.address)).to.be.false; // No commitment yet

      // The summon function now requires a randomValue parameter
      // This is enforced at the contract level, not just the TypeScript level
      await expect(
        eldritchain.summon(
          BigInt("1234567890123456789012345678901234567890123456789012345678901234")
        )
      ).to.be.revertedWith("Cannot summon. Must commit first and wait for target block.");
    });
  });

  describe("User Collection", function () {
    it("Should return empty collection for new user", async function () {
      const [ids, levels] = await eldritchain.getUserCollection(user1.address);
      expect(ids.length).to.equal(0);
      expect(levels.length).to.equal(0);
    });

    it("Should return correct collection after commit-reveal summon", async function () {
      // Use commit-reveal scheme for summoning
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [randomValue])
      );

      // Commit
      await eldritchain.commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Summon
      await eldritchain.summon(randomValue);

      const [ids, levels] = await eldritchain.getUserCollection(owner.address);
      expect(ids.length).to.equal(1);
      expect(levels.length).to.equal(1);
      expect(levels[0]).to.equal(1);
    });
  });

  describe("Timing", function () {
    it("Should return next UTC day start as next summon time", async function () {
      // Use commit-reveal scheme for summoning
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [randomValue])
      );

      // Commit
      await eldritchain.commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Summon
      const tx = await eldritchain.summon(randomValue);
      await tx.wait();

      const lastSummon = await eldritchain.getLastSummonTime(owner.address);
      const nextSummon = await eldritchain.getNextSummonTime(owner.address);

      // Next summon should be at start of next UTC day
      const lastSummonDay = Number(lastSummon) / 86400;
      const nextDay = Math.floor(lastSummonDay) + 1;
      const expectedNextSummon = nextDay * 86400;

      expect(nextSummon).to.be.gte(expectedNextSummon);
    });

    it("Should return current time for expired commitment (255+ blocks old)", async function () {
      // Use commit-reveal scheme - just commit without summoning
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [randomValue])
      );

      // Commit
      await eldritchain.commitRandom(hash);

      // Mine 256+ blocks to make the commitment expired
      for (let i = 0; i < 260; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      const nextSummon = await eldritchain.getNextSummonTime(owner.address);
      const currentBlock = await ethers.provider.getBlock("latest");
      const currentTime = currentBlock!.timestamp;

      // Should return current time since commitment is expired
      expect(nextSummon).to.be.closeTo(currentTime, 10); // Allow 10 second tolerance
    });

    it("Should return current time for commitment from different day", async function () {
      // Use commit-reveal scheme - just commit without summoning
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [randomValue])
      );

      // Commit
      await eldritchain.commitRandom(hash);

      // Fast forward to next UTC day (86400 seconds)
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine", []);

      const nextSummon = await eldritchain.getNextSummonTime(owner.address);
      const currentBlock = await ethers.provider.getBlock("latest");
      const currentTime = currentBlock!.timestamp;

      // Should return current time since commitment is from different day
      expect(nextSummon).to.be.closeTo(currentTime, 10); // Allow 10 second tolerance
    });

    it("Should return current time for first-time user", async function () {
      const nextSummon = await eldritchain.getNextSummonTime(owner.address);
      const currentBlock = await ethers.provider.getBlock("latest");
      const currentTime = currentBlock!.timestamp;

      // First summon should be available immediately
      expect(nextSummon).to.be.closeTo(currentTime, 10); // Allow 10 second tolerance
    });
  });
});
