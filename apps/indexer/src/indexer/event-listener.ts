import { bigIntMax, bigIntMin, getCreatureRarity } from "@eldritchain/common";
import mongoose from "mongoose";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { indexerConfig } from "../config.indexer";
import { IndexerState, SummonEvent } from "../db/models";

/** Sleep for specified milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  // Check if event already exists to avoid duplicate key error
  const existingEvent = await SummonEvent.findOne({ transactionHash }).session(session);
  if (existingEvent) {
    return; // Skip duplicate
  }

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
      console.log(`🔍 Processing block range: ${fromBlock} to ${toBlock}`);
      await processSingleChunkInTransaction(fromBlock, toBlock, session);

      // Atomically update state after successful processing
      // Store the window start (latest - 100), not the end block
      const result = await IndexerState.updateOne(
        {},
        {
          lastProcessedBlock: toBlock.toString(),
          updatedAt: new Date(),
        },
        { upsert: true, session }
      );

      // Verify that either an update or insert occurred
      if (result.modifiedCount === 0 && result.upsertedCount === 0) {
        throw new Error("Failed to update or insert indexer state");
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

/** Determine what block range to process next */
async function determineProcessRange(): Promise<{
  fromBlock: bigint;
  toBlock: bigint;
} | null> {
  const [state, finalizedBlock] = await Promise.all([
    IndexerState.findOne(),
    (async () => {
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
    })(),
  ]);

  const lastProcessedBlock = state?.lastProcessedBlock
    ? BigInt(state.lastProcessedBlock.toString())
    : indexerConfig.startBlock - 1n;

  const windowSize = indexerConfig.safeBlockRange;
  // Compute the head window start (latest - windowSize), clamped at 0
  const latestWindowStart = bigIntMax(0n, finalizedBlock - windowSize);

  // Choose the next range start:
  // - prefer continuing from next unprocessed block (lastProcessedBlock + 1)
  // - but never go past the head window start (latestWindowStart)
  // - and never go before the configured startBlock
  const fromBlock = bigIntMax(
    indexerConfig.startBlock,
    bigIntMin(lastProcessedBlock + 1n, latestWindowStart)
  );
  // End at window size or the current finalized head, whichever is smaller
  const toBlock = bigIntMin(fromBlock + windowSize - 1n, finalizedBlock);

  return {
    fromBlock,
    toBlock,
  };
}

/** Main indexer loop */
export async function startEventListener(): Promise<void> {
  console.log("🚀 Starting event listener...");
  console.log(`📍 Contract: ${indexerConfig.contract.address}`);
  console.log(
    `🌐 Network: ${indexerConfig.contract.networkName} (Chain ID: ${indexerConfig.contract.chainId})`
  );
  console.log(`🔗 RPC: ${indexerConfig.contract.rpcUrl}`);

  // Get initial window start for logging
  const initialState = await IndexerState.findOne();
  const initialWindowStart = initialState?.lastProcessedBlock
    ? BigInt(initialState.lastProcessedBlock.toString())
    : indexerConfig.startBlock - 1n;

  console.log(`⏮️  Current window start: ${initialWindowStart}`);
  console.log(`⏱️  Poll interval: ${indexerConfig.pollInterval}ms`);
  console.log(`📊 Window size: ${indexerConfig.safeBlockRange} blocks\n`);

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
      const processRange = await determineProcessRange();
      if (processRange) {
        await processBlockRange(processRange.fromBlock, processRange.toBlock);
      }
    } catch (error) {
      console.error("❌ Error in event listener:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      // Always sleep after each iteration (even on error)
      await sleep(indexerConfig.pollInterval);
    }

    // Check if shutdown was requested during sleep
    if (isShuttingDown) {
      break;
    }
  }

  console.log("✅ Event listener stopped gracefully\n");
}
