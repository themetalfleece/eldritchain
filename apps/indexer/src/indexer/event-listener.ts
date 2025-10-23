import { getCreatureRarity } from "@eldritchain/common";
import mongoose from "mongoose";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { indexerConfig } from "../config.indexer";
import { IndexerState, SummonEvent } from "../db/models";

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
};

/** Sleep for specified milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry a function with exponential backoff */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string,
  retryCount = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retryCount >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(2, retryCount), RETRY_CONFIG.maxDelay);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `⚠️  ${context} failed (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries}), retrying in ${delay}ms:`,
      errorMessage
    );

    await sleep(delay);
    return retryWithBackoff(fn, context, retryCount + 1);
  }
}

const contractAbi = [
  parseAbiItem(
    "event CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp)"
  ),
];

const publicClient = createPublicClient({
  transport: http(indexerConfig.contract.rpcUrl),
});

/** Process a single CreatureSummoned event within a transaction */
async function processEventInTransaction(log: Log, session: mongoose.ClientSession): Promise<void> {
  const { args, blockNumber, transactionHash } = log as Log & {
    args: { summoner: string; creatureId: bigint; level: bigint; timestamp: bigint };
    blockNumber: bigint;
    transactionHash: string;
  };

  if (!args?.summoner || args?.creatureId === undefined || !transactionHash) {
    console.warn("⚠️ Invalid event args, skipping:", {
      transactionHash,
      blockNumber,
      args: args
        ? {
            summoner: args.summoner,
            creatureId: args.creatureId,
            level: args.level,
            timestamp: args.timestamp,
          }
        : null,
    });
    return; // Skip malformed events (shouldn't happen with valid contracts)
  }

  const address = args.summoner.toLowerCase();
  const creatureId = Number(args.creatureId);
  const level = Number(args.level);
  const timestamp = new Date(Number(args.timestamp) * 1000);
  const rarity = getCreatureRarity(creatureId);

  try {
    // Insert summon event within transaction
    await SummonEvent.create(
      [
        {
          address,
          creatureId,
          rarity,
          level,
          timestamp,
          blockNumber: blockNumber.toString(),
          transactionHash,
        },
      ],
      { session }
    );
    console.log(
      `📝 Processed event: ${transactionHash} (${address} summoned ${rarity} creature ${creatureId})`
    );
  } catch (error) {
    // Check if it's a duplicate key error
    if (
      error instanceof Error &&
      (error.message.includes("duplicate key") || error.message.includes("E11000"))
    ) {
      console.log(`⏭️  Duplicate event detected (likely from another indexer): ${transactionHash}`);
      return; // Don't throw, just skip
    }

    console.error(`❌ Database insert failed for ${transactionHash}:`, {
      error: error instanceof Error ? error.message : String(error),
      address,
      creatureId,
      rarity,
      level,
      timestamp: timestamp.toISOString(),
      blockNumber: blockNumber.toString(),
      transactionHash,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}

/** Fetch and process events from a single block range within a transaction */
async function processSingleChunkInTransaction(
  fromBlock: bigint,
  toBlock: bigint,
  session: mongoose.ClientSession
): Promise<void> {
  try {
    const logs = await publicClient.getLogs({
      address: indexerConfig.contract.address,
      event: contractAbi[0],
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) {
      return; // No events to process
    }

    // Process all events within the transaction
    for (const log of logs) {
      await processEventInTransaction(log, session);
    }
  } catch (error) {
    console.error(`❌ Failed to process chunk ${fromBlock}-${toBlock}:`, {
      error: error instanceof Error ? error.message : String(error),
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      contractAddress: indexerConfig.contract.address,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}

/** Fetch and process events from a block range with transactions */
async function processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
  // Use MongoDB transaction for atomic processing + state update
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Process events in this block range
      await processSingleChunkInTransaction(fromBlock, toBlock, session);

      // Atomically update state after successful processing
      const result = await IndexerState.findOneAndUpdate(
        {},
        {
          lastProcessedBlock: toBlock.toString(),
          updatedAt: new Date(),
        },
        { upsert: true, session }
      );

      if (!result) {
        throw new Error("Failed to update indexer state");
      }
    });
  } catch (error) {
    console.error(
      `❌ Block range failed (blocks ${fromBlock}-${toBlock}):`,
      error instanceof Error ? error.message : String(error)
    );
    throw error; // Re-throw to trigger retry
  } finally {
    await session.endSession();
  }
}

/** Main indexer loop */
export async function startEventListener(): Promise<void> {
  console.log("🚀 Starting event listener...");
  console.log(`📍 Contract: ${indexerConfig.contract.address}`);
  console.log(
    `🌐 Network: ${indexerConfig.contract.networkName} (Chain ID: ${indexerConfig.contract.chainId})`
  );
  console.log(`🔗 RPC: ${indexerConfig.contract.rpcUrl}`);

  // Get initial last processed block for logging
  const initialState = await IndexerState.findOne();
  const initialLastBlock = initialState?.lastProcessedBlock
    ? BigInt(initialState.lastProcessedBlock.toString())
    : indexerConfig.startBlock;

  console.log(`⏮️  Starting from block ${initialLastBlock}`);
  console.log(`⏱️  Poll interval: ${indexerConfig.pollInterval}ms`);
  console.log(`📊 Max blocks per poll: ${indexerConfig.maxBlocksPerPoll}`);
  console.log(`🔄 Max retries: ${RETRY_CONFIG.maxRetries}\n`);

  // Flag for graceful shutdown
  let isShuttingDown = false;

  // Graceful shutdown handler
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    isShuttingDown = true;
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    isShuttingDown = true;
  });

  console.log("✅ Event listener started\n");

  // Continuous loop instead of setInterval to ensure sequential processing
  while (!isShuttingDown) {
    try {
      // Get current blockchain state with retry
      const [state, finalizedBlock] = await Promise.all([
        retryWithBackoff(() => IndexerState.findOne(), "Database state fetch"),
        retryWithBackoff(async () => {
          try {
            // Try to get the finalized block first (most reliable)
            const block = await publicClient.getBlock({ blockTag: "finalized" });
            return block.number;
          } catch (error) {
            // Fallback to safe block if finalized is not supported
            console.warn("⚠️  Finalized block not supported, using safe block as fallback");
            const block = await publicClient.getBlock({ blockTag: "safe" });
            return block.number;
          }
        }, "Finalized block fetch"),
      ]);

      const lastProcessedBlock = state?.lastProcessedBlock
        ? BigInt(state.lastProcessedBlock.toString())
        : indexerConfig.startBlock;

      // Finalized blocks are crypto-economically secure and should never go backwards
      // If they do, it's a critical network issue that requires manual intervention
      // No automatic reorg handling needed since finalized blocks are immutable by design
      if (finalizedBlock < lastProcessedBlock) {
        console.error(
          `🚨 CRITICAL: Finalized block (${finalizedBlock}) is behind processed block (${lastProcessedBlock}). ` +
            `This indicates a major network issue. Manual intervention required.`
        );
        // Don't automatically reset - this requires human attention
        throw new Error(
          `Finalized block went backwards: ${finalizedBlock} < ${lastProcessedBlock}. ` +
            `This indicates a critical network issue requiring manual intervention.`
        );
      }

      if (finalizedBlock > lastProcessedBlock) {
        // Process up to maxBlocksPerPoll blocks at a time
        const fromBlock = lastProcessedBlock + 1n;
        const blocksToProcess = finalizedBlock - lastProcessedBlock;
        const maxBlocksPerPoll = BigInt(indexerConfig.maxBlocksPerPoll);
        const blocksThisPoll =
          blocksToProcess > maxBlocksPerPoll ? maxBlocksPerPoll : blocksToProcess;
        const toBlock = lastProcessedBlock + blocksThisPoll;

        await retryWithBackoff(
          () => processBlockRange(fromBlock, toBlock),
          `Block range processing (${fromBlock}-${toBlock})`
        );
      } else {
        // No new blocks to process, log status
        console.log(
          `⏸️  No new blocks to process (last: ${lastProcessedBlock}, finalized: ${finalizedBlock})`
        );
      }
    } catch (error) {
      console.error("❌ Error in event listener:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Wait before next iteration (even if there was an error)
    await sleep(indexerConfig.pollInterval);

    // Check if shutdown was requested during sleep
    if (isShuttingDown) {
      break;
    }
  }

  console.log("✅ Event listener stopped gracefully\n");
}
