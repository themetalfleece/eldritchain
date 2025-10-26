import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCommitmentData,
  formatBlocksRemaining,
  generateCommitmentData,
  getCommitmentData,
  isSameDay,
  storeCommitmentData,
  type CommitmentData,
  type ContractCommitment,
} from "./commit-reveal.utils";

describe("commit-reveal.utils", () => {
  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("generateCommitmentData", () => {
    it("should generate commitment data with random value and hash", () => {
      const result = generateCommitmentData();

      expect(result).toHaveProperty("randomValue");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("commitTimestamp");
      expect(result).toHaveProperty("targetBlockNumber");

      expect(typeof result.randomValue).toBe("bigint");
      expect(typeof result.hash).toBe("string");
      expect(typeof result.commitTimestamp).toBe("number");
      expect(result.targetBlockNumber).toBe(0);

      // Verify hash format (should be 0x followed by 64 hex characters)
      expect(result.hash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it("should generate different random values on multiple calls", () => {
      const result1 = generateCommitmentData();
      const result2 = generateCommitmentData();

      // In real implementation, random values should be different
      expect(result1.randomValue).toBeDefined();
      expect(result2.randomValue).toBeDefined();
      expect(result1.randomValue).not.toBe(result2.randomValue);
    });

    it("should use current timestamp for commitTimestamp", () => {
      const before = Math.floor(Date.now() / 1000);
      const result = generateCommitmentData();
      const after = Math.floor(Date.now() / 1000);

      expect(result.commitTimestamp).toBeGreaterThanOrEqual(before);
      expect(result.commitTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("storeCommitmentData", () => {
    it("should store commitment data in localStorage with correct key", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const data: CommitmentData = {
        randomValue: BigInt("1234567890123456789012345678901234567890"),
        hash: "0x" + "a".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 100,
      };

      storeCommitmentData(address, data);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "commitment_0x1234567890123456789012345678901234567890",
        JSON.stringify({
          randomValue: "1234567890123456789012345678901234567890",
          hash: "0x" + "a".repeat(64),
          commitTimestamp: 1640995200,
          targetBlockNumber: 100,
        })
      );
    });

    it("should handle lowercase addresses", () => {
      const address = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
      const data: CommitmentData = {
        randomValue: BigInt("123"),
        hash: "0x" + "b".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 50,
      };

      storeCommitmentData(address, data);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "commitment_0xabcdef1234567890abcdef1234567890abcdef12",
        expect.any(String)
      );
    });
  });

  describe("getCommitmentData", () => {
    it("should retrieve commitment data from localStorage", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const storedData = {
        randomValue: "1234567890123456789012345678901234567890",
        hash: "0x" + "a".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 100,
      };

      localStorage.setItem(
        "commitment_0x1234567890123456789012345678901234567890",
        JSON.stringify(storedData)
      );

      const result = getCommitmentData(address);

      expect(result).toEqual({
        randomValue: BigInt("1234567890123456789012345678901234567890"),
        hash: "0x" + "a".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 100,
      });
    });

    it("should return null when no data exists", () => {
      const address = "0x1234567890123456789012345678901234567890";
      const result = getCommitmentData(address);
      expect(result).toBeNull();
    });

    it("should return null when data is invalid JSON", () => {
      const address = "0x1234567890123456789012345678901234567890";
      localStorage.setItem("commitment_0x1234567890123456789012345678901234567890", "invalid json");

      const result = getCommitmentData(address);
      expect(result).toBeNull();
    });

    it("should handle lowercase addresses", () => {
      const address = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";
      const storedData = {
        randomValue: "123",
        hash: "0x" + "b".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 50,
      };

      localStorage.setItem(
        "commitment_0xabcdef1234567890abcdef1234567890abcdef12",
        JSON.stringify(storedData)
      );

      const result = getCommitmentData(address);
      expect(result).toEqual({
        randomValue: BigInt("123"),
        hash: "0x" + "b".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 50,
      });
    });
  });

  describe("clearCommitmentData", () => {
    it("should remove commitment data from localStorage", () => {
      const address = "0x1234567890123456789012345678901234567890";

      clearCommitmentData(address);

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        "commitment_0x1234567890123456789012345678901234567890"
      );
    });

    it("should handle lowercase addresses", () => {
      const address = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";

      clearCommitmentData(address);

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        "commitment_0xabcdef1234567890abcdef1234567890abcdef12"
      );
    });
  });

  describe("isSameDay", () => {
    it("should return true for timestamps on the same day", () => {
      const timestamp1 = 1640995200; // 2022-01-01 00:00:00 UTC
      const timestamp2 = 1640998800; // 2022-01-01 01:00:00 UTC (same day, 1 hour later)

      const result = isSameDay(timestamp1, timestamp2);
      expect(result).toBe(true);
    });

    it("should return false for timestamps on different days", () => {
      const timestamp1 = 1640995200; // 2022-01-01 00:00:00 UTC
      const timestamp2 = 1641081600; // 2022-01-02 00:00:00 UTC (next day)

      const result = isSameDay(timestamp1, timestamp2);
      expect(result).toBe(false);
    });

    it("should return true for same timestamp", () => {
      const timestamp = 1640995200; // 2022-01-01 00:00:00 UTC

      const result = isSameDay(timestamp, timestamp);
      expect(result).toBe(true);
    });
  });

  describe("formatBlocksRemaining", () => {
    it('should return "Ready to summon!" when blocks remaining is 0 or negative', () => {
      expect(formatBlocksRemaining(0)).toBe("Ready to summon!");
      expect(formatBlocksRemaining(-1)).toBe("Ready to summon!");
      expect(formatBlocksRemaining(-10)).toBe("Ready to summon!");
    });

    it("should format seconds only when less than 1 minute", () => {
      const blocks = 15; // 15 blocks * 2 seconds = 30 seconds
      const result = formatBlocksRemaining(blocks);
      expect(result).toBe("30s (15 blocks)");
    });

    it("should format minutes and seconds when 1 minute or more", () => {
      const blocks = 30; // 30 blocks * 2 seconds = 60 seconds = 1 minute
      const result = formatBlocksRemaining(blocks);
      expect(result).toBe("1m 0s (30 blocks)");
    });

    it("should format hours, minutes and seconds when 1 hour or more", () => {
      const blocks = 1800; // 1800 blocks * 2 seconds = 3600 seconds = 60 minutes = 1 hour
      const result = formatBlocksRemaining(blocks);
      expect(result).toBe("1h 0m 0s (1800 blocks)");
    });

    it("should handle fractional hours correctly", () => {
      const blocks = 2700; // 2700 blocks * 2 seconds = 5400 seconds = 90 minutes = 1h 30m
      const result = formatBlocksRemaining(blocks);
      expect(result).toBe("1h 30m 0s (2700 blocks)");
    });
  });

  describe("Type definitions", () => {
    it("should have correct CommitmentData interface structure", () => {
      const data: CommitmentData = {
        randomValue: BigInt("123"),
        hash: "0x" + "a".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 100,
      };

      expect(typeof data.randomValue).toBe("bigint");
      expect(typeof data.hash).toBe("string");
      expect(typeof data.commitTimestamp).toBe("number");
      expect(typeof data.targetBlockNumber).toBe("number");
    });

    it("should have correct ContractCommitment interface structure", () => {
      const contractCommitment: ContractCommitment = {
        hash: "0x" + "a".repeat(64),
        commitTimestamp: BigInt("1640995200"),
        targetBlockNumber: BigInt("100"),
        isRevealed: false,
      };

      expect(typeof contractCommitment.hash).toBe("string");
      expect(typeof contractCommitment.commitTimestamp).toBe("bigint");
      expect(typeof contractCommitment.targetBlockNumber).toBe("bigint");
      expect(typeof contractCommitment.isRevealed).toBe("boolean");
    });
  });

  describe("Integration tests", () => {
    it("should work with complete commit-reveal flow", () => {
      const address = "0x1234567890123456789012345678901234567890";

      // Generate commitment data
      const commitmentData = generateCommitmentData();
      expect(commitmentData).toBeDefined();
      expect(commitmentData.randomValue).toBeDefined();
      expect(commitmentData.hash).toBeDefined();

      // Store commitment data
      storeCommitmentData(address, commitmentData);
      expect(localStorage.setItem).toHaveBeenCalled();

      // Retrieve commitment data
      const retrievedData = getCommitmentData(address);
      expect(retrievedData).toEqual(commitmentData);

      // Clear commitment data
      clearCommitmentData(address);
      expect(localStorage.removeItem).toHaveBeenCalled();

      // Verify data is cleared
      const clearedData = getCommitmentData(address);
      expect(clearedData).toBeNull();
    });

    it("should handle multiple addresses independently", () => {
      const address1 = "0x1111111111111111111111111111111111111111";
      const address2 = "0x2222222222222222222222222222222222222222";

      const data1: CommitmentData = {
        randomValue: BigInt("111"),
        hash: "0x" + "1".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 100,
      };

      const data2: CommitmentData = {
        randomValue: BigInt("222"),
        hash: "0x" + "2".repeat(64),
        commitTimestamp: 1640995200,
        targetBlockNumber: 200,
      };

      // Store data for both addresses
      storeCommitmentData(address1, data1);
      storeCommitmentData(address2, data2);

      // Retrieve data for both addresses
      const retrieved1 = getCommitmentData(address1);
      const retrieved2 = getCommitmentData(address2);

      expect(retrieved1).toEqual(data1);
      expect(retrieved2).toEqual(data2);

      // Clear data for one address
      clearCommitmentData(address1);

      // Verify only one address is cleared
      expect(getCommitmentData(address1)).toBeNull();
      expect(getCommitmentData(address2)).toEqual(data2);
    });
  });
});
