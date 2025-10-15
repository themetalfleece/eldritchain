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
    })) as any;
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

  describe("Summoning", function () {
    it("Should allow first summon", async function () {
      expect(await eldritchain.canSummon(owner.address)).to.be.true;
      await expect(eldritchain.summon()).to.emit(eldritchain, "CreatureSummoned");
    });

    it("Should return a valid creature ID", async function () {
      const tx = await eldritchain.summon();
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => log.fragment?.name === "CreatureSummoned");
      expect(event).to.not.be.undefined;
    });

    it("Should increment creature level", async function () {
      const tx = await eldritchain.summon();
      const receipt = await tx.wait();

      const creatureSummonedEvent = receipt?.logs.find(
        (log: any) => log.fragment?.name === "CreatureSummoned"
      ) as any;

      const creatureId = creatureSummonedEvent.args[1];
      const level = await eldritchain.getCreatureLevel(owner.address, creatureId);
      expect(level).to.equal(1);
    });

    it("Should not allow summon on same UTC day", async function () {
      await eldritchain.summon();
      await expect(eldritchain.summon()).to.be.revertedWith(
        "Cannot summon yet. Please wait for cooldown."
      );
    });

    it("Should allow summon on different UTC day", async function () {
      await eldritchain.summon();

      // Fast forward to next UTC day (24 hours)
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      expect(await eldritchain.canSummon(owner.address)).to.be.true;
      await expect(eldritchain.summon()).to.emit(eldritchain, "CreatureSummoned");
    });

    it("Should allow summon after short time if different UTC day", async function () {
      // Get current block time
      const block = await ethers.provider.getBlock("latest");
      const currentTime = block!.timestamp;

      // Calculate next UTC midnight
      const currentDay = Math.floor(currentTime / 86400);
      const nextMidnight = (currentDay + 1) * 86400;

      // Set time to 1 minute before midnight
      await ethers.provider.send("evm_setNextBlockTimestamp", [nextMidnight - 60]);
      await ethers.provider.send("evm_mine", []);

      // First summon at end of day
      await eldritchain.summon();

      // Fast forward 2 minutes (now it's 1 minute past midnight - new day!)
      await ethers.provider.send("evm_setNextBlockTimestamp", [nextMidnight + 60]);
      await ethers.provider.send("evm_mine", []);

      // Should be able to summon again immediately (new UTC day!)
      expect(await eldritchain.canSummon(owner.address)).to.be.true;
      await expect(eldritchain.summon()).to.emit(eldritchain, "CreatureSummoned");
    });

    it("Should track multiple summons over multiple days", async function () {
      await eldritchain.summon();

      // Fast forward and summon multiple times (3 more days)
      for (let i = 0; i < 3; i++) {
        await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
        await ethers.provider.send("evm_mine", []);
        await eldritchain.summon();
      }

      // Should have summoned 4 times total
      const [ids] = await eldritchain.getUserCollection(owner.address);
      expect(ids.length).to.be.gte(1);
      expect(ids.length).to.be.lte(4); // Could be 1-4 unique creatures
    });
  });

  describe("User Collection", function () {
    it("Should return empty collection for new user", async function () {
      const [ids, levels] = await eldritchain.getUserCollection(user1.address);
      expect(ids.length).to.equal(0);
      expect(levels.length).to.equal(0);
    });

    it("Should return correct collection after summons", async function () {
      await eldritchain.summon();

      const [ids, levels] = await eldritchain.getUserCollection(owner.address);
      expect(ids.length).to.equal(1);
      expect(levels.length).to.equal(1);
      expect(levels[0]).to.equal(1);
    });
  });

  describe("Timing", function () {
    it("Should return next UTC day start as next summon time", async function () {
      const tx = await eldritchain.summon();
      await tx.wait();

      const lastSummon = await eldritchain.getLastSummonTime(owner.address);
      const nextSummon = await eldritchain.getNextSummonTime(owner.address);

      // Next summon should be at start of next UTC day
      const lastSummonDay = Number(lastSummon) / 86400;
      const nextDay = Math.floor(lastSummonDay) + 1;
      const expectedNextSummon = nextDay * 86400;

      expect(nextSummon).to.be.gte(expectedNextSummon);
    });
  });
});
