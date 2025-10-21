import { getCreatureRarity } from "@eldritchain/common";
import mongoose from "mongoose";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { config } from "../config";
import { IndexerState, SummonEvent } from "../db/models";

const contractAbi = [
  parseAbiItem(
    "event CreatureSummoned(address indexed summoner, uint16 indexed creatureId, uint16 level, uint256 timestamp)"
  ),
];

const publicClient = createPublicClient({
  transport: http(config.contract.rpcUrl),
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

  // Check if already processed (idempotency)
  const exists = await SummonEvent.findOne({ transactionHash }).session(session);
  if (exists) {
    console.log(`⏭️  Skipping duplicate: ${transactionHash}`);
    return;
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

/** Fetch and process events from a single block range (max 10 blocks) within a transaction */
async function processSingleChunkInTransaction(
  fromBlock: bigint,
  toBlock: bigint,
  session: mongoose.ClientSession
): Promise<void> {
  try {
    const logs = await publicClient.getLogs({
      address: config.contract.address,
      event: contractAbi[0],
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) {
      return; // No events to process
    }

    // Process all events within the existing transaction
    for (const log of logs) {
      await processEventInTransaction(log, session);
    }
  } catch (error) {
    console.error(`❌ Failed to process chunk ${fromBlock}-${toBlock}:`, {
      error: error instanceof Error ? error.message : String(error),
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      contractAddress: config.contract.address,
    });
    throw error; // Re-throw to trigger transaction rollback
  }
}

/** Fetch and process events from a block range, chunked to avoid RPC limits */
async function processBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
  const maxChunkSize = 10n;
  let currentBlock = fromBlock;

  // Process in chunks of max 10 blocks (~20s)
  while (currentBlock <= toBlock) {
    const chunkEnd = currentBlock + maxChunkSize - 1n;
    const actualEnd = chunkEnd > toBlock ? toBlock : chunkEnd;

    try {
      // Use transaction for atomic chunk processing + state update
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          // Process events in this chunk
          await processSingleChunkInTransaction(currentBlock, actualEnd, session);

          // Update state after successful chunk processing
          await IndexerState.findOneAndUpdate(
            {},
            {
              lastProcessedBlock: actualEnd.toString(),
              updatedAt: new Date(),
            },
            { upsert: true, session }
          );
        });
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error(
        `❌ Chunk failed (blocks ${currentBlock}-${actualEnd}):`,
        error instanceof Error ? error.message : String(error)
      );
      throw error; // Re-throw to trigger retry of entire range
    }

    currentBlock = actualEnd + 1n;
  }
}

/** Main indexer loop */
export async function startEventListener(): Promise<void> {
  console.log("🚀 Starting event listener...");
  console.log(`📍 Contract: ${config.contract.address}`);
  console.log(`🌐 Network: ${config.contract.networkName} (Chain ID: ${config.contract.chainId})`);
  console.log(`🔗 RPC: ${config.contract.rpcUrl}`);

  // Get last processed block or start from config
  const state = await IndexerState.findOne();
  let lastBlock = state?.lastProcessedBlock
    ? BigInt(state.lastProcessedBlock.toString())
    : config.indexer.startBlock;

  console.log(`⏮️  Starting from block ${lastBlock}\n`);

  // Poll for new blocks
  setInterval(async () => {
    try {
      const latestBlock = await publicClient.getBlockNumber();

      if (latestBlock > lastBlock) {
        await processBlockRange(lastBlock + 1n, latestBlock);
        lastBlock = latestBlock; // Only update in-memory state after successful processing
      }
    } catch (error) {
      console.error("❌ Error in event listener (will retry next interval):", {
        error: error instanceof Error ? error.message : String(error),
        lastBlock: lastBlock.toString(),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // lastBlock is NOT updated -> same range will be retried next interval
      // Idempotency checks in processEvent prevent duplicate processing
    }
  }, config.indexer.pollInterval);

  console.log("✅ Event listener started\n");
}
