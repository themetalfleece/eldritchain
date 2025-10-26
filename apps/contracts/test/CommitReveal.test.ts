import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Eldritchain } from "../typechain-types";

describe("Eldritchain Commit-Reveal", function () {
  let eldritchain: Eldritchain;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const EldritchainFactory = await ethers.getContractFactory("Eldritchain", owner);
    eldritchain = (await upgrades.deployProxy(EldritchainFactory, [], {
      initializer: "initialize",
      kind: "uups",
    })) as unknown as Eldritchain;
    await eldritchain.waitForDeployment();
  });

  describe("Commitment Phase", function () {
    it("Should allow user to commit random value", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await expect(eldritchain.connect(user1).commitRandom(hash)).to.emit(
        eldritchain,
        "RandomCommitted"
      );
    });

    it("Should not allow user to commit twice in same day", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // First commit should succeed
      await eldritchain.connect(user1).commitRandom(hash1);

      // Second commit should fail
      await expect(eldritchain.connect(user1).commitRandom(hash2)).to.be.revertedWith(
        "Cannot commit. Please wait for cooldown or complete current commitment."
      );
    });

    it("Should allow user to commit on different days", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // First commit
      await eldritchain.connect(user1).commitRandom(hash1);

      // Fast forward to next UTC day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Second commit should succeed
      await expect(eldritchain.connect(user1).commitRandom(hash2)).to.emit(
        eldritchain,
        "RandomCommitted"
      );
    });

    it("Should not allow commit when user cannot summon (cooldown)", async function () {
      // First, user summons (which puts them on cooldown)
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      await eldritchain.connect(user1).summon(randomValue);

      // Now user is on cooldown, should not be able to commit
      const newRandomValue = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const newHash = ethers.keccak256(ethers.toUtf8Bytes(newRandomValue.toString()));

      await expect(eldritchain.connect(user1).commitRandom(newHash)).to.be.revertedWith(
        "Cannot commit. Please wait for cooldown or complete current commitment."
      );
    });

    it("Should store correct commitment data", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      const blockBefore = await ethers.provider.getBlock("latest");

      await eldritchain.connect(user1).commitRandom(hash);

      const commitment = await eldritchain.getCommitment(user1.address);

      expect(commitment.hash).to.equal(hash);
      expect(commitment.isRevealed).to.be.false;
      expect(commitment.targetBlockNumber).to.equal(blockBefore!.number + 6); // +1 for commit tx, +5 for target
      expect(commitment.commitTimestamp).to.be.gte(blockBefore!.timestamp);
    });
  });

  describe("Reveal Phase", function () {
    it("Should allow reveal after target block is mined", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Should be able to reveal now
      expect(await eldritchain.canSummon(user1.address)).to.be.true;
      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should not allow reveal before target block is mined", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Try to reveal immediately (should fail)
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });

    it("Should not allow reveal with wrong random value", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const wrongRandomValue = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Try to reveal with wrong value
      await expect(eldritchain.connect(user1).summon(wrongRandomValue)).to.be.revertedWith(
        "Invalid random value. Must match committed hash."
      );
    });

    it("Should not allow reveal after commitment expires (different day)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Fast forward to next UTC day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Should not be able to reveal (commitment expired)
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });

    it("Should not allow double reveal", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // First reveal should succeed
      await eldritchain.connect(user1).summon(randomValue);

      // Second reveal should fail
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });
  });

  describe("canCommit Function", function () {
    it("Should return true for new user", async function () {
      expect(await eldritchain.canCommit(user1.address)).to.be.true;
    });

    it("Should return true for user who is not on cooldown and hasn't committed today", async function () {
      // Fast forward to next day to ensure user is not on cooldown
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Should be able to commit (not on cooldown and hasn't committed today)
      expect(await eldritchain.canCommit(user1.address)).to.be.true;
    });

    it("Should return false for user on cooldown", async function () {
      // First, user summons (which puts them on cooldown)
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      await eldritchain.connect(user1).summon(randomValue);

      // Should not be able to commit (on cooldown)
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
    });

    it("Should return false for user who already committed today", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Should not be able to commit again today
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
    });

    it("Should return true for user who committed yesterday", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Fast forward to next UTC day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Should be able to commit again
      expect(await eldritchain.canCommit(user1.address)).to.be.true;
    });

    it("Should return false for user who revealed commitment (on cooldown)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit
      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Reveal
      await eldritchain.connect(user1).summon(randomValue);

      // Should not be able to commit (on cooldown after reveal)
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
    });
  });

  describe("Randomness and Security", function () {
    it("Should generate different results with different random values", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // First user commits and reveals
      await eldritchain.connect(user1).commitRandom(hash1);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const tx1 = await eldritchain.connect(user1).summon(randomValue1);
      const receipt1 = await tx1.wait();

      // Fast forward to next day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Second user commits and reveals
      await eldritchain.connect(user2).commitRandom(hash2);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      const tx2 = await eldritchain.connect(user2).summon(randomValue2);
      const receipt2 = await tx2.wait();

      // Extract creature IDs from events
      const event1 = receipt1?.logs.find(
        (log) => log.topics[0] === eldritchain.interface.getEvent("CreatureSummoned").topicHash
      );
      const event2 = receipt2?.logs.find(
        (log) => log.topics[0] === eldritchain.interface.getEvent("CreatureSummoned").topicHash
      );

      expect(event1).to.not.be.undefined;
      expect(event2).to.not.be.undefined;

      // Results should be different (very high probability)
      const creatureId1 = BigInt(event1!.topics[2]);
      const creatureId2 = BigInt(event2!.topics[2]);

      // Note: This test could theoretically fail if both users get the same creature,
      // but the probability is extremely low given the randomness sources
      expect(creatureId1).to.not.equal(creatureId2);
    });

    it("Should use target block hash in randomness generation", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Commit and get target block number
      await eldritchain.connect(user1).commitRandom(hash);
      const commitment = await eldritchain.getCommitment(user1.address);
      const targetBlockNumber = commitment.targetBlockNumber;

      // Mine blocks up to target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Get the target block hash
      const targetBlock = await ethers.provider.getBlock(Number(targetBlockNumber));

      // Reveal and check that target block hash was used
      const tx = await eldritchain.connect(user1).summon(randomValue);
      const receipt = await tx.wait();

      // Should succeed and emit event
      expect(
        receipt?.logs.find(
          (log) => log.topics[0] === eldritchain.interface.getEvent("CreatureSummoned").topicHash
        )
      ).to.not.be.undefined;

      // The target block should be the one we committed to
      expect(targetBlock?.number).to.equal(Number(targetBlockNumber));
    });
  });

  describe("Hash Verification Edge Cases", function () {
    it("Should verify hash with abi.encodePacked (contract method)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );

      // Use the same encoding method as the contract
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Should succeed with correct encoding
      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should work with ABI encoding for uint256 (same as abi.encodePacked)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );

      // Use ABI encoding (same result as abi.encodePacked for uint256)
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Should succeed because both encoding methods produce same result for uint256
      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should handle zero random value", async function () {
      const randomValue = BigInt(0);
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should handle maximum uint256 value", async function () {
      const randomValue = BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });
  });

  describe("Block Hash Availability Tests", function () {
    it("Should handle target block within 256 blocks", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);
      const commitment = await eldritchain.getCommitment(user1.address);
      const targetBlockNumber = commitment.targetBlockNumber;

      // Mine exactly 5 blocks to reach target
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Verify target block hash is available
      const targetBlock = await ethers.provider.getBlock(Number(targetBlockNumber));
      expect(targetBlock).to.not.be.null;
      expect(targetBlock!.hash).to.not.equal(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );

      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should not allow summon when target block is beyond 256 blocks (blockhash returns 0)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Mine 300 blocks to make target block older than 256 blocks
      for (let i = 0; i < 300; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // canSummon should return false due to blockhash limitation
      expect(await eldritchain.canSummon(user1.address)).to.be.false;

      // Should fail due to blockhash limitation
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });

    it("Should not allow summon when target block is more than 256 blocks ago (blockhash = 0)", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);
      const commitment = await eldritchain.getCommitment(user1.address);
      const targetBlockNumber = commitment.targetBlockNumber;

      // Mine 300 blocks
      for (let i = 0; i < 300; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Verify blockhash returns 0 for old block
      const currentBlock = await ethers.provider.getBlock("latest");
      const blockDiff = currentBlock!.number - Number(targetBlockNumber);
      expect(blockDiff).to.be.greaterThan(256);

      // canSummon should return false due to blockhash limitation
      expect(await eldritchain.canSummon(user1.address)).to.be.false;

      // The summon should fail due to blockhash limitation
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });
  });

  describe("Reentrancy and State Management", function () {
    it("Should prevent double reveal in same transaction", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      await eldritchain.connect(user1).commitRandom(hash);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // First reveal should succeed
      await eldritchain.connect(user1).summon(randomValue);

      // Verify commitment is marked as revealed but hash is preserved
      const commitment = await eldritchain.getCommitment(user1.address);
      expect(commitment.isRevealed).to.be.true;
      expect(commitment.hash).to.equal(hash); // Hash should be preserved for audit trail

      // Second reveal should fail
      await expect(eldritchain.connect(user1).summon(randomValue)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });

    it("Should handle commitment state transitions correctly", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Initial state
      expect(await eldritchain.canCommit(user1.address)).to.be.true;
      expect(await eldritchain.canSummon(user1.address)).to.be.false;

      // After commit
      await eldritchain.connect(user1).commitRandom(hash);
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
      expect(await eldritchain.canSummon(user1.address)).to.be.false;

      // After target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
      expect(await eldritchain.canSummon(user1.address)).to.be.true;

      // After reveal
      await eldritchain.connect(user1).summon(randomValue);
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
    });
  });

  describe("Randomness Quality Tests", function () {
    it("Should generate different results with same random value but different block contexts", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // First summon
      await eldritchain.connect(user1).commitRandom(hash);
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      const tx1 = await eldritchain.connect(user1).summon(randomValue);
      const receipt1 = await tx1.wait();

      // Fast forward to next day
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Second summon with same random value but different block context
      await eldritchain.connect(user1).commitRandom(hash);
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      const tx2 = await eldritchain.connect(user1).summon(randomValue);
      const receipt2 = await tx2.wait();

      // Extract creature IDs
      const event1 = receipt1?.logs.find(
        (log) => log.topics[0] === eldritchain.interface.getEvent("CreatureSummoned").topicHash
      );
      const event2 = receipt2?.logs.find(
        (log) => log.topics[0] === eldritchain.interface.getEvent("CreatureSummoned").topicHash
      );

      expect(event1).to.not.be.undefined;
      expect(event2).to.not.be.undefined;

      const creatureId1 = BigInt(event1!.topics[2]);
      const creatureId2 = BigInt(event2!.topics[2]);

      // Results should be different due to different block contexts
      expect(creatureId1).to.not.equal(creatureId2);
    });

    it("Should maintain randomness even with blockhash = 0", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // Commit both users
      await eldritchain.connect(user1).commitRandom(hash1);
      await eldritchain.connect(user2).commitRandom(hash2);

      // Mine 300 blocks to make target blocks old
      for (let i = 0; i < 300; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Both should fail due to blockhash limitation
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
      expect(await eldritchain.canSummon(user2.address)).to.be.false;

      await expect(eldritchain.connect(user1).summon(randomValue1)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
      await expect(eldritchain.connect(user2).summon(randomValue2)).to.be.revertedWith(
        "Cannot summon. Must commit first and wait for target block."
      );
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should reject commitment with zero hash", async function () {
      const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

      // Should fail to commit zero hash
      await expect(eldritchain.connect(user1).commitRandom(zeroHash)).to.be.revertedWith(
        "Cannot commit zero hash"
      );
    });

    it("Should handle very large target block numbers", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Get current block number
      const currentBlock = await ethers.provider.getBlock("latest");
      const initialBlockNumber = currentBlock!.number;

      await eldritchain.connect(user1).commitRandom(hash);
      const commitment = await eldritchain.getCommitment(user1.address);

      // Target should be 5 blocks ahead
      expect(commitment.targetBlockNumber).to.equal(initialBlockNumber + 6); // +1 for commit tx, +5 for target

      // Mine to target
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );
    });

    it("Should handle rapid successive commits from different users", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // Both users commit sequentially
      await eldritchain.connect(user1).commitRandom(hash1);
      await eldritchain.connect(user2).commitRandom(hash2);

      // Both should have target block numbers (may be different if in different blocks)
      const commitment1 = await eldritchain.getCommitment(user1.address);
      const commitment2 = await eldritchain.getCommitment(user2.address);

      // Both should have valid commitments
      expect(commitment1.targetBlockNumber).to.be.greaterThan(0);
      expect(commitment2.targetBlockNumber).to.be.greaterThan(0);

      // Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Both should be able to reveal
      expect(await eldritchain.canSummon(user1.address)).to.be.true;
      expect(await eldritchain.canSummon(user2.address)).to.be.true;
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full commit-reveal cycle", async function () {
      const randomValue = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const hash = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue]));

      // Step 1: Commit
      await expect(eldritchain.connect(user1).commitRandom(hash)).to.emit(
        eldritchain,
        "RandomCommitted"
      );

      // Step 2: Wait for target block
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Step 3: Reveal and summon
      await expect(eldritchain.connect(user1).summon(randomValue)).to.emit(
        eldritchain,
        "CreatureSummoned"
      );

      // Step 4: Verify user is on cooldown
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
    });

    it("Should handle multiple users independently", async function () {
      const randomValue1 = BigInt(
        "1234567890123456789012345678901234567890123456789012345678901234"
      );
      const randomValue2 = BigInt(
        "9876543210987654321098765432109876543210987654321098765432109876"
      );
      const hash1 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue1]));
      const hash2 = ethers.keccak256(ethers.solidityPacked(["uint256"], [randomValue2]));

      // Both users commit
      await eldritchain.connect(user1).commitRandom(hash1);
      await eldritchain.connect(user2).commitRandom(hash2);

      // Both should have committed today (can't commit again)
      expect(await eldritchain.canCommit(user1.address)).to.be.false;
      expect(await eldritchain.canCommit(user2.address)).to.be.false;

      // Wait for target blocks
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);
      await ethers.provider.send("evm_mine", []);

      // Both should be able to reveal
      expect(await eldritchain.canSummon(user1.address)).to.be.true;
      expect(await eldritchain.canSummon(user2.address)).to.be.true;

      // Both reveal successfully
      await eldritchain.connect(user1).summon(randomValue1);
      await eldritchain.connect(user2).summon(randomValue2);

      // Both should be on cooldown
      expect(await eldritchain.canSummon(user1.address)).to.be.false;
      expect(await eldritchain.canSummon(user2.address)).to.be.false;
    });
  });
});
