import { CONTRACT_ADDRESS } from "@/config/contract.config";
import * as commitRevealUtils from "@/lib/commit-reveal.utils";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useSummonActions,
  useSummonAutoActions,
  useSummonButtonText,
  useSummonEvents,
  useSummonPhase,
  useSummonStatus,
  useSummonStatusMessage,
  type SummonPhase,
} from "./SummonButton.hooks";

// Mock the commit-reveal utils
vi.mock("@/lib/commit-reveal.utils", () => ({
  generateCommitmentData: vi.fn(),
  storeCommitmentData: vi.fn(),
  getCommitmentData: vi.fn(),
  clearCommitmentData: vi.fn(),
  formatBlocksRemaining: vi.fn(),
}));

// Mock wagmi hooks
const mockUseAccount = vi.fn();
const mockUseBlockNumber = vi.fn();
const mockUseReadContract = vi.fn();
const mockUseWriteContract = vi.fn();
const mockUseWaitForTransactionReceipt = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => mockUseAccount(),
  useBlockNumber: () => mockUseBlockNumber(),
  useReadContract: () => mockUseReadContract(),
  useWriteContract: () => mockUseWriteContract(),
  useWaitForTransactionReceipt: () => mockUseWaitForTransactionReceipt(),
}));

// Mock contract config
vi.mock("@/config/contract.config", () => ({
  CONTRACT_ADDRESS: "0x1234567890123456789012345678901234567890",
  CONTRACT_ABI: [],
}));

describe("SummonButton Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations for commit-reveal utils
    vi.mocked(commitRevealUtils.generateCommitmentData).mockReturnValue({
      randomValue: BigInt("1234567890123456789012345678901234567890"),
      hash: "0x" + "a".repeat(64),
      commitTimestamp: 1640995200,
      targetBlockNumber: 0,
    });
    vi.mocked(commitRevealUtils.storeCommitmentData).mockImplementation(() => {});
    vi.mocked(commitRevealUtils.getCommitmentData).mockReturnValue(null);
    vi.mocked(commitRevealUtils.clearCommitmentData).mockImplementation(() => {});
    vi.mocked(commitRevealUtils.formatBlocksRemaining).mockImplementation(
      (blocks) => `${blocks}m (${blocks} blocks)`
    );

    // Default mock implementations for wagmi hooks
    mockUseAccount.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });

    mockUseBlockNumber.mockReturnValue({
      data: 1000,
    });

    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    mockUseWriteContract.mockReturnValue({
      writeContract: vi.fn(),
      isPending: false,
      error: null,
    });

    mockUseWaitForTransactionReceipt.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
  });

  describe("useSummonPhase", () => {
    it("should return expected properties", () => {
      const { result } = renderHook(() => useSummonPhase());

      expect(result.current).toHaveProperty("phase");
      expect(result.current).toHaveProperty("commitmentData");
      expect(result.current).toHaveProperty("setCommitmentData");
      expect(result.current).toHaveProperty("canSummon");
      expect(result.current).toHaveProperty("canCommit");
      expect(result.current).toHaveProperty("contractCommitment");
      expect(result.current).toHaveProperty("currentBlockNumber");
      expect(result.current).toHaveProperty("blocksRemaining");
    });

    it("should return valid phase values", () => {
      const { result } = renderHook(() => useSummonPhase());

      const validPhases = [
        "commit_available",
        "committing",
        "waiting_for_reveal_available",
        "summon_available",
        "summoning",
        "creature_summoned",
        "cooldown_active",
        "loading",
      ];
      expect(validPhases).toContain(result.current.phase);
    });
  });

  describe("useSummonActions", () => {
    it("should return expected properties", () => {
      const mockSetCommitmentData = vi.fn();
      const { result } = renderHook(() =>
        useSummonActions({
          commitmentData: null,
          setCommitmentData: mockSetCommitmentData,
        })
      );

      expect(result.current).toHaveProperty("handleCommit");
      expect(result.current).toHaveProperty("handleSummon");
      expect(result.current).toHaveProperty("isCommitPending");
      expect(result.current).toHaveProperty("isCommitConfirming");
      expect(result.current).toHaveProperty("isCommitSuccess");
      expect(result.current).toHaveProperty("commitError");
      expect(result.current).toHaveProperty("commitReceipt");
      expect(result.current).toHaveProperty("isSummonPending");
      expect(result.current).toHaveProperty("isSummonConfirming");
      expect(result.current).toHaveProperty("isSummonSuccess");
      expect(result.current).toHaveProperty("summonError");
      expect(result.current).toHaveProperty("summonReceipt");
    });

    it("should provide functions for actions", () => {
      const mockSetCommitmentData = vi.fn();
      const { result } = renderHook(() =>
        useSummonActions({
          commitmentData: null,
          setCommitmentData: mockSetCommitmentData,
        })
      );

      expect(typeof result.current.handleCommit).toBe("function");
      expect(typeof result.current.handleSummon).toBe("function");
    });
  });

  describe("useSummonEvents", () => {
    it("should render without errors", () => {
      const mockSetSummonedCreature = vi.fn();

      // This hook doesn't return anything, it's a side-effect hook
      expect(() => {
        renderHook(() =>
          useSummonEvents({
            setSummonedCreature: mockSetSummonedCreature,
          })
        );
      }).not.toThrow();
    });

    it("should clear commitment data after successful summon", () => {
      const mockSetSummonedCreature = vi.fn();
      const mockAddress = "0x1234567890123456789012345678901234567890";

      // Mock the wagmi hooks
      mockUseAccount.mockReturnValue({
        address: mockAddress as `0x${string}`,
        isConnected: true,
      });

      mockUseWriteContract.mockReturnValue({
        data: "0xtxhash",
        isSuccess: true,
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: {
          logs: [
            {
              address: CONTRACT_ADDRESS,
              topics: [
                "0x" + "CreatureSummoned".padEnd(64, "0"), // Event signature
                "0x0000000000000000000000001234567890123456789012345678901234567890", // user address
                "0x0000000000000000000000000000000000000000000000000000000000000001", // creature ID 1
              ],
            },
          ],
        },
      });

      renderHook(() =>
        useSummonEvents({
          setSummonedCreature: mockSetSummonedCreature,
        })
      );

      // Should clear commitment data after summon
      expect(commitRevealUtils.clearCommitmentData).toHaveBeenCalledWith(mockAddress);
    });

    it("should not clear commitment data if no summon event", () => {
      const mockSetSummonedCreature = vi.fn();
      const mockAddress = "0x1234567890123456789012345678901234567890";

      // Mock the wagmi hooks
      mockUseAccount.mockReturnValue({
        address: mockAddress as `0x${string}`,
        isConnected: true,
      });

      mockUseWriteContract.mockReturnValue({
        data: "0xtxhash",
        isSuccess: true,
      });

      mockUseWaitForTransactionReceipt.mockReturnValue({
        data: {
          logs: [], // No logs
        },
      });

      renderHook(() =>
        useSummonEvents({
          setSummonedCreature: mockSetSummonedCreature,
        })
      );

      // Should not clear commitment data if no summon event
      expect(commitRevealUtils.clearCommitmentData).not.toHaveBeenCalled();
    });
  });

  describe("useSummonStatus", () => {
    it("should return expected properties", () => {
      const { result } = renderHook(() => useSummonStatus({ enabled: true }));

      expect(result.current).toHaveProperty("nextSummonTime");
    });
  });

  describe("useSummonButtonText", () => {
    it("should return expected properties", () => {
      const { result } = renderHook(() =>
        useSummonButtonText({
          phase: "commit_available",
          isCommitPending: false,
          isCommitConfirming: false,
          isCommitSuccess: false,
          isSummonPending: false,
          isSummonConfirming: false,
          isSummonSuccess: false,
        })
      );

      expect(result.current).toHaveProperty("getButtonText");
      expect(result.current).toHaveProperty("buttonText");
      expect(result.current).toHaveProperty("buttonDisabled");
    });

    it("should return string values", () => {
      const { result } = renderHook(() =>
        useSummonButtonText({
          phase: "commit_available",
          isCommitPending: false,
          isCommitConfirming: false,
          isCommitSuccess: false,
          isSummonPending: false,
          isSummonConfirming: false,
          isSummonSuccess: false,
        })
      );

      expect(typeof result.current.buttonText).toBe("string");
      expect(typeof result.current.getButtonText()).toBe("string");
      expect(typeof result.current.buttonDisabled).toBe("boolean");
    });

    it("should handle committing phase", () => {
      const { result } = renderHook(() =>
        useSummonButtonText({
          phase: "committing",
          isCommitPending: false,
          isCommitConfirming: false,
          isCommitSuccess: false,
          isSummonPending: false,
          isSummonConfirming: false,
          isSummonSuccess: false,
        })
      );

      expect(result.current.buttonText).toBe("Committing...");
    });

    it("should handle summoning phase", () => {
      const { result } = renderHook(() =>
        useSummonButtonText({
          phase: "summoning",
          isCommitPending: false,
          isCommitConfirming: false,
          isCommitSuccess: false,
          isSummonPending: false,
          isSummonConfirming: false,
          isSummonSuccess: false,
        })
      );

      expect(result.current.buttonText).toBe("Summoning...");
    });

    it("should handle creature_summoned phase", () => {
      const { result } = renderHook(() =>
        useSummonButtonText({
          phase: "creature_summoned",
          isCommitPending: false,
          isCommitConfirming: false,
          isCommitSuccess: false,
          isSummonPending: false,
          isSummonConfirming: false,
          isSummonSuccess: false,
        })
      );

      expect(result.current.buttonText).toBe("Creature Summoned!");
      expect(result.current.buttonDisabled).toBe(true);
    });
  });

  describe("useSummonStatusMessage", () => {
    it("should return expected properties", () => {
      const { result } = renderHook(() =>
        useSummonStatusMessage({
          phase: "commit_available",
          contractCommitment: undefined,
          currentBlockNumber: 1000,
        })
      );

      expect(result.current).toHaveProperty("getStatusMessage");
    });

    it("should return string values", () => {
      const { result } = renderHook(() =>
        useSummonStatusMessage({
          phase: "commit_available",
          contractCommitment: undefined,
          currentBlockNumber: 1000,
        })
      );

      expect(typeof result.current.getStatusMessage()).toBe("string");
    });

    it("should handle committing phase", () => {
      const { result } = renderHook(() =>
        useSummonStatusMessage({
          phase: "committing",
          contractCommitment: undefined,
          currentBlockNumber: 1000,
        })
      );

      expect(result.current.getStatusMessage()).toBe(
        "You are committing your random value to the blockchain... [Transaction 1/2]"
      );
    });

    it("should handle summoning phase", () => {
      const { result } = renderHook(() =>
        useSummonStatusMessage({
          phase: "summoning",
          contractCommitment: undefined,
          currentBlockNumber: 1000,
        })
      );

      expect(result.current.getStatusMessage()).toBe(
        "You are summoning your creature... Best of luck!"
      );
    });

    it("should handle creature_summoned phase", () => {
      const { result } = renderHook(() =>
        useSummonStatusMessage({
          phase: "creature_summoned",
          contractCommitment: undefined,
          currentBlockNumber: 1000,
        })
      );

      expect(result.current.getStatusMessage()).toBe(
        "Congratulations! Your creature has been summoned successfully."
      );
    });
  });

  describe("useSummonAutoActions", () => {
    it("should NOT call handleCommit when phase is commit_available (manual only)", () => {
      const mockHandleSummon = vi.fn();
      const mockCommitmentData = {
        randomValue: 123n,
        hash: "0x123",
        commitTimestamp: 1234567890,
        targetBlockNumber: 100,
      };

      renderHook(() =>
        useSummonAutoActions({
          phase: "commit_available",
          handleSummon: mockHandleSummon,
          commitmentData: mockCommitmentData,
        })
      );

      expect(mockHandleSummon).not.toHaveBeenCalled();
    });

    it("should call handleSummon when phase is summon_available", () => {
      const mockHandleSummon = vi.fn();
      const mockCommitmentData = {
        randomValue: 123n,
        hash: "0x123",
        commitTimestamp: 1234567890,
        targetBlockNumber: 100,
      };

      renderHook(() =>
        useSummonAutoActions({
          phase: "summon_available",
          handleSummon: mockHandleSummon,
          commitmentData: mockCommitmentData,
        })
      );

      expect(mockHandleSummon).toHaveBeenCalledTimes(1);
    });

    it("should not call any handlers for other phases", () => {
      const mockHandleSummon = vi.fn();
      const mockCommitmentData = {
        randomValue: 123n,
        hash: "0x123",
        commitTimestamp: 1234567890,
        targetBlockNumber: 100,
      };

      renderHook(() =>
        useSummonAutoActions({
          phase: "waiting_for_reveal_available",
          handleSummon: mockHandleSummon,
          commitmentData: mockCommitmentData,
        })
      );

      expect(mockHandleSummon).not.toHaveBeenCalled();
    });

    it("should re-trigger when phase changes", () => {
      const mockHandleSummon = vi.fn();
      const mockCommitmentData = {
        randomValue: 123n,
        hash: "0x123",
        commitTimestamp: 1234567890,
        targetBlockNumber: 100,
      };

      const { rerender } = renderHook(
        ({ phase }) =>
          useSummonAutoActions({
            phase,
            handleSummon: mockHandleSummon,
            commitmentData: mockCommitmentData,
          }),
        {
          initialProps: { phase: "waiting_for_reveal_available" as SummonPhase },
        }
      );

      expect(mockHandleSummon).not.toHaveBeenCalled();

      // Change to commit_available (should not trigger)
      rerender({ phase: "commit_available" });
      expect(mockHandleSummon).not.toHaveBeenCalled();

      // Change to summon_available (should trigger)
      rerender({ phase: "summon_available" });
      expect(mockHandleSummon).toHaveBeenCalledTimes(1);
    });
  });
});
